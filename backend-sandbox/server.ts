import "dotenv/config";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import { createServer } from "http";
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

io.on("connection", (socket) => {
  console.log(`✅ Nawiązano połączenie WebSocket! ID kabla: ${socket.id}`);
  socket.on("sendMessage", (dane) => {
    try {
      console.log(dane.x);
    } catch {
      console.log("Błąd socket");
    }
  });
  socket.on("disconnect", () => {
    console.log(`❌ Rozłączono: ${socket.id}`);
  });
});

const PORT = 5000;

httpServer.listen(PORT, () => {
  console.log(`>>> SERWER HTTP & WEBSOCKET URUCHOMIONY NA PORCIE ${PORT} <<<`);
});