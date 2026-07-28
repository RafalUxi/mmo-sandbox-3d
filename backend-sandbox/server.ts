import "dotenv/config";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { Server, Socket } from "socket.io";
import crypto from "node:crypto";
import { authRouter } from "./routes/auth";
import { playerRouter } from "./routes/player";
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
app.use("/player", playerRouter);

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

const connectionUsers = new Map<number, string>();

io.on("connection", (socket: CustomSocket) => {
  if (socket.userId) {
    connectionUsers.set(socket.userId, socket.id);
  }
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

  socket.on("AddFriends", async (dane) => {
    if (!dane.name) return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd danych wejściowych" });
    const friendName = dane.name;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (!socket.userId) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd id socketa" });
      }

      // Pierwsze sprawdzenie czy dodano samego siebie
      const resultName = await client.query("SELECT username FROM users WHERE id = $1 FOR UPDATE", [socket.userId]);
      if (resultName.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd odczytu danych z bazy" });
      }

      if (resultName.rows[0].username === friendName) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Dodano samego siebie" });
      }

      // Odczyt id targetu
      const resultsAdd = await client.query("SELECT id FROM users WHERE username = $1 FOR UPDATE", [friendName]);
      if (resultsAdd.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błędna nazwa użytkownika" });
      }

      // Sprawdzenie czy gracze są już w znajomych
      const friends_list_results = await client.query("SELECT friends_list FROM player_stats WHERE user_id = $1 FOR UPDATE", [socket.userId]);
      if (friends_list_results.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd pobrania danych z bazy" });
      }

      const friends_list: string[] = friends_list_results.rows[0].friends_list;

      if (friends_list.includes(friendName)) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Już jesteście w znajomych" });
      }

      const targetData = resultsAdd.rows[0].id; // id gracza - target
      const targetSocketId = connectionUsers.get(targetData); // id socketu - target

      // Pobranie nazwy gracza - sender
      const playerName = await client.query("SELECT username FROM users WHERE id = $1 FOR UPDATE", [socket.userId]);
      if (playerName.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd odczytu danych z bazy" });
      }

      // Sprawdzenie czy sender wysłał wiele zaproszeń na raz
      const existingReq = await client.query("SELECT friend_requests FROM player_stats WHERE user_id = $1 FOR UPDATE", [targetData]);
      const pending: number[] = existingReq.rows[0].friend_requests ?? [];
      if (pending.includes(socket.userId!)) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Zaproszenie już wysłano" });
      }

      // Przesłanie zapytania
      if (targetSocketId) {
        await client.query("UPDATE player_stats SET friend_requests = array_append(friend_requests, $1) WHERE user_id = $2", [socket.userId, targetData]); // Zapisanie znacznika zaproszenia

        io.to(targetSocketId).emit("addFriendsRequest", { success: true, type: "request", message: `Wojownik ${playerName.rows[0].username} zaprasza Cie do znajomych`, odKogo: playerName.rows[0].username });
        await client.query("COMMIT");
        return socket.emit("addFriendsResult", { success: true, message: "Wysłano zaproszenie" });
      } else {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Gracz jest offline" });
      }
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Błąd pobierania danych:", err);
      return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd pobierania danych" });
    } finally {
      client.release();
    }
  });

  socket.on("AddFriendsResponseYes", async (dane) => {
    if (!dane.nameSender) return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd danych wejściowych" });
    const friendName = dane.nameSender;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (!socket.userId) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd socketa" });
      }
      // Odczyt nazwy - target
      const resultTarget = await client.query("SELECT username FROM users WHERE id = $1 FOR UPDATE", [socket.userId]);
      if (resultTarget.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd odczytu danych z bazy" });
      }

      // Weryfikacja nazawy Sendera - czyli pobranie id Sender
      const resultSender = await client.query("SELECT id FROM users WHERE username = $1 FOR UPDATE", [friendName]);
      if (resultSender.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błędna nazwa użytkownika (wymuszenie?)" });
      }

      // Sprawdzenie znacznika na podstawie id
      const result = await client.query("SELECT friend_requests FROM player_stats WHERE user_id = $1 FOR UPDATE", [socket.userId]);
      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd odczytu danych" });
      }
      const friend_request_checker: number[] = (result.rows[0].friend_requests ?? []).map(Number);
      const senderId = resultSender.rows[0].id;
      const targetName = resultTarget.rows[0].username;
      const senderSocketId = connectionUsers.get(senderId); // id socketu - sendera

      if (friend_request_checker.includes(senderId)) {
        await client.query("UPDATE player_stats SET friend_requests = array_remove(friend_requests, $1) WHERE user_id = $2", [senderId, socket.userId]); // Usunięcie znacznika zaproszenia
        const update_list_sender = await client.query("UPDATE player_stats SET friends_list = array_append(friends_list, $1) WHERE user_id = $2 RETURNING friends_list", [targetName, senderId]); // Dodanie do listy znajomych - sender
        const update_list_target = await client.query("UPDATE player_stats SET friends_list  = array_append(friends_list, $1) WHERE user_id = $2 RETURNING friends_list", [friendName, socket.userId]); // Dodanie do listy znajomych - target

        await client.query("COMMIT");
        if (senderSocketId) {
          io.to(senderSocketId).emit("addFriendsResult", { type: "addFriend", message: "Poprawnie zaakceptowano zaproszenie", list: update_list_sender.rows[0].friends_list });
        }
        return socket.emit("addFriendsResult", { type: "addFriend", message: "Poprawnie zaakceptowano zaproszenie", list: update_list_target.rows[0].friends_list });
      } else {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Bład znacznika - odmowa zaproszenia do znajomych" });
      }
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Błąd pobierania danych:", err);
      return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd pobierania danych" });
    } finally {
      client.release();
    }
  });

  socket.on("AddFriendsResponseNo", async (dane) => {
    if (!dane.nameSender) return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd danych wejściowych" });
    const friendName = dane.nameSender;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (!socket.userId) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd socketa" });
      }

      // Weryfikacja nazawy Sendera - czyli pobranie id Sender
      const resultSender = await client.query("SELECT id FROM users WHERE username = $1 FOR UPDATE", [friendName]);
      if (resultSender.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błędna nazwa użytkownika (wymuszenie?)" });
      }

      // Sprawdzenie znacznika na podstawie id
      const result = await client.query("SELECT friend_requests FROM player_stats WHERE user_id = $1 FOR UPDATE", [socket.userId]);
      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd odczytu danych" });
      }
      const friend_request_checker: number[] = (result.rows[0].friend_requests ?? []).map(Number);
      const senderId = resultSender.rows[0].id;

      if (friend_request_checker.includes(senderId)) {
        await client.query("UPDATE player_stats SET friend_requests = array_remove(friend_requests, $1) WHERE user_id = $2", [senderId, socket.userId]); // Usunięcie znacznika zaproszenia

        await client.query("COMMIT");
        return socket.emit("addFriendsResult", { success: true, message: "Poprawnie odmówiono zaproszenia" });
      } else {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Bład znacznika - odmowa zaproszenia do znajomych" });
      }
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Błąd pobierania danych:", err);
      return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd pobierania danych" });
    } finally {
      client.release();
    }
  });

  const activeCasinoSessions = new Set<string>();
  socket.on("casinoStart", async (dane) => {
    if (activeCasinoSessions.has(socket.id)) return;
    activeCasinoSessions.add(socket.id); // Blokada przed duplikatami wysyły start (cheat)
    try {
      const playerId = socket.userId;
      const house_edge = 0.05;
      goldInput = dane.goldInput;

      const result = await pool.query("SELECT gold FROM player_stats WHERE user_id = $1", [playerId]);

      if (result.rows.length === 0) {
        activeCasinoSessions.delete(socket.id);
        return socket.emit("casinoResult", { success: false, message: "Nie znaleziono gracza w bazie!" });
      }

      if (goldInput <= 0) {
        activeCasinoSessions.delete(socket.id);
        return socket.emit("casinoResult", { success: false, message: "Źle wpisana wartośc golda" });
      }

      let currentGold = result.rows[0].gold;

      if (currentGold > goldInput && dane.event === "Start") {
        const random = crypto.randomInt(1, 1000000) / 1000000;
        const crash = (1 - house_edge) / random;
        const crashOut = Math.min(10, Math.max(1, Math.floor(crash * 100) / 100)); // zwrot 1-10

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
        }, 60);

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
    if (intervalId === null) return; // Gra musi być otwarta żeby zatrzymac
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
        const currentGoldHolder = currentGold;

        currentGold = Math.floor(currentGold - goldInput + goldInput * multiplier);
        multiplier = 1;
        socket.emit("casinoUpdateMultiplier", { currentMultiplier: 1 });

        await pool.query("UPDATE player_stats SET gold = $1 WHERE user_id = $2", [currentGold, playerId]);
        return socket.emit("casinoResult", { success: true, message: `Win`, gold: currentGold, winGold: currentGold - currentGoldHolder });
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
    if (socket.userId) {
      connectionUsers.delete(socket.userId);
    }
  });
});

const PORT = 5000;

httpServer.listen(PORT, () => {
  console.log(`>>> SERWER HTTP & WEBSOCKET URUCHOMIONY NA PORCIE ${PORT} <<<`);
});