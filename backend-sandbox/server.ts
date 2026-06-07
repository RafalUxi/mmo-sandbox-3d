import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { Server, Socket } from "socket.io";

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`✅ Nawiązano połączenie WebSocket! ID kabla: ${socket.id}`);
  socket.on("sendMessage", (dane) => {
    try {
      console.log(dane.tekst);
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