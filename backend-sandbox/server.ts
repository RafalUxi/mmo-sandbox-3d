import "dotenv/config";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { Server, Socket } from "socket.io";
import crypto from "node:crypto";
import { authRouter } from "./routes/auth";
import jwt from "jsonwebtoken";
import { pool } from "./config/db";

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("BRAK KLUCZA SECRET_KEY W PLIKU .env");
}

const app = express();
app.use(cors());
app.use(express.json());

// Router - endpoints
app.use("/auth", authRouter);

// do tego websocekt może się podpiąć
const httpServer = createServer(app);

// włączenie serwera (centrali)- argument cors przepuszcza tylko zapytania z frontendu (react)
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

interface CustomSocket extends Socket {
  userId?: number;
}

io.use((socket: CustomSocket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Brak tokena"));
  }

  try {
    const zdekodowany = jwt.verify(token, SECRET_KEY) as { userId: number };

    socket.userId = zdekodowany.userId;

    next();
  } catch (err) {
    next(new Error("Nieważny token!"));
  }
});

io.on("connection", (socket: CustomSocket) => {
  console.log(`✅ Nawiązano połączenie WebSocket! ID kabla: ${socket.id} id gracza: ${socket.userId}`);
  let multiplier = 1; // zmienna mnożnika kasyna
  let intervalId: ReturnType<typeof setInterval> | null = null; // zmienna przetrzymująca id interwału kasyna
  let goldInput: number = 0; // gold do pomnożenia

  socket.on("sendMessage", (dane) => {
    try {
      io.emit("playerMove", { id: socket.id, x: dane.x, y: dane.y, z: dane.z, action: dane.action, rotation: dane.rotation });
    } catch {
      console.log("Błąd socket");
    }
  });

  const activeCasinoSessions = new Set<string>();
  socket.on("casinoStart", async (dane) => {
    if (activeCasinoSessions.has(socket.id)) return;
    activeCasinoSessions.add(socket.id); // Blokada przed duplikatami wysyły start (cheat)
    try {
      const playerId = socket.userId;
      const house_edge = 0.03;
      goldInput = dane.goldInput;

      const result = await pool.query("SELECT gold FROM player_stats WHERE user_id = $1", [playerId]);

      if (result.rows.length === 0) {
        activeCasinoSessions.delete(socket.id);
        return socket.emit("casinoResult", { success: false, message: "Nie znaleziono gracza w bazie!" });
      }

      let currentGold = result.rows[0].gold;

      if (currentGold > goldInput && dane.event === "Start") {
        const random = crypto.randomInt(1, 1000000) / 1000000;
        const crash = (1 - house_edge) / random;
        const crashOut = Math.min(10, Math.max(1, Math.floor(crash * 100) / 100)); // zwrot 1-10
        console.log(crashOut);

        intervalId = setInterval(async () => {
          multiplier += 0.01;

          if (multiplier >= crashOut) {
            clearInterval(intervalId!);
            activeCasinoSessions.delete(socket.id);
            currentGold -= goldInput;
            multiplier = 1;
            intervalId = null;
            socket.emit("casinoResult", { success: true, message: "Crash", gold: currentGold });
            await pool.query("UPDATE player_stats SET gold = $1 WHERE user_id = $2", [currentGold, playerId]);
            socket.emit("casinoUpdateMultiplier", { currentMultiplier: 1 });
            return;
          }

          socket.emit("casinoUpdateMultiplier", { currentMultiplier: multiplier });
        }, 75);

        return socket.emit("casinoResult", { success: true, message: "Poprawnie rozpocząto grę", gold: currentGold });
      } else {
        activeCasinoSessions.delete(socket.id);
        return socket.emit("casinoResult", { success: false, message: "Brak golda" });
      }
    } catch (err) {
      console.log("CasinoStart", err);
      activeCasinoSessions.delete(socket.id);
    }
  });

  socket.on("casinoStop", async (dane) => {
    if (intervalId === null) return;
    activeCasinoSessions.delete(socket.id);
    try {
      const playerId = socket.userId;
      if (dane.event === "Stop") {
        clearInterval(intervalId!);
        intervalId = null;

        const result = await pool.query("SELECT gold FROM player_stats WHERE user_id = $1", [playerId]);

        if (result.rows.length === 0) {
          return socket.emit("casinoResult", { success: false, message: "Nie znaleziono gracza w bazie!" });
        }

        let currentGold = result.rows[0].gold;
        currentGold = Math.floor(currentGold - goldInput + goldInput * multiplier);
        multiplier = 1;
        socket.emit("casinoUpdateMultiplier", { currentMultiplier: 1 });

        await pool.query("UPDATE player_stats SET gold = $1 WHERE user_id = $2", [currentGold, playerId]);
        return socket.emit("casinoResult", { success: true, message: `Wygrana: ${currentGold}`, gold: currentGold });
      } else {
        return socket.emit("casinoResult", { success: false, message: "Błąd zatrzymania gry" });
      }
    } catch (err) {
      console.log("CasinoStop", err);
    }
  });

  socket.on("disconnect", () => {
    if (intervalId !== null) clearInterval(intervalId);
    io.emit("disconnectPlayer", { id: socket.id });
    activeCasinoSessions.delete(socket.id);
    console.log(`❌ Rozłączono: ${socket.id}`);
  });
});

const PORT = 5000;

httpServer.listen(PORT, () => {
  console.log(`>>> SERWER HTTP & WEBSOCKET URUCHOMIONY NA PORCIE ${PORT} <<<`);
});