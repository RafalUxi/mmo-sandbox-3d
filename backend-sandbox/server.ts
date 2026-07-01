import "dotenv/config";
import jwt from "jsonwebtoken";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import { createServer } from "http";
import bcrypt from "bcryptjs";
import { pool } from "./config/db";
import express from "express";
import cors from "cors";
import { Server, Socket } from "socket.io";

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("BRAK KLUCZA SECRET_KEY W PLIKU .env");
}

const app = express();
app.use(cors());
app.use(express.json());

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

io.on("connection", (socket: CustomSocket) => {
  console.log(`✅ Nawiązano połączenie WebSocket! ID kabla: ${socket.id}`);
  socket.on("sendMessage", (dane) => {
    try {
      io.emit("playerMove", { id: socket.id, x: dane.x, y: dane.y, z: dane.z, action: dane.action, rotation: dane.rotation });
    } catch {
      console.log("Błąd socket");
    }
  });
  socket.on("disconnect", () => {
    io.emit("disconnectPlayer", { id: socket.id });
    console.log(`❌ Rozłączono: ${socket.id}`);
  });
});

app.post("/login", async (req, res) => {
  const { chatInput_login_login, chatInput_login_password } = req.body;

  try {
    const userResult = await pool.query("SELECT id, password_hash FROM users WHERE username = $1 ", [chatInput_login_login]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Nieprawidłowy login lub hasło." });
    }

    const userData = userResult.rows[0];

    const isPassword = await bcrypt.compare(chatInput_login_password, userData.password_hash);

    if (!isPassword) {
      return res.status(401).json({ message: "Nieprawidłowy login lub hasło." });
    }

    const gameToken = jwt.sign(
      { userId: userData.id }, // Pakujemy do środka ID gracza
      SECRET_KEY,
      { expiresIn: "24h" }, // Token straci ważność po 24 godzinach
    );

    res.status(200).json({
      message: "Zalogowano pomyślnie!",
      userId: userData.id,
      token: gameToken,
    });
  } catch (err) {
    console.error("Błąd rejestracji", err);
  }
});

app.post("/register", async (req, res) => {
  const { chatInput_registger_login, chatInput_registger_password } = req.body;
  const saltRounds = 10;
  try {
    const hashedPassword = await bcrypt.hash(chatInput_registger_password, saltRounds);
    console.log(hashedPassword);

    const userResult = await pool.query("INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id ", [chatInput_registger_login, hashedPassword]);

    const newUserId = userResult.rows[0].id;
    console.log(newUserId);

    await pool.query("INSERT INTO player_stats (gold, inventory, damage, user_id) VALUES ($1, $2, $3, $4)", [100, JSON.stringify([]), 25, newUserId]);
    await pool.query("INSERT INTO boss_stats (hp,maxhp,boss_id) VALUES ($1, $2, $3)", [100, 100, newUserId]);

    res.status(200).json({ message: "Dane dotarły na serwer" });
  } catch (err) {
    res.status(400).json({ message: "Błąd rejestracji -  wpisz inne dane" });
    console.error("Błąd rejestracji");
  }
});

const PORT = 5000;

httpServer.listen(PORT, () => {
  console.log(`>>> SERWER HTTP & WEBSOCKET URUCHOMIONY NA PORCIE ${PORT} <<<`);
});