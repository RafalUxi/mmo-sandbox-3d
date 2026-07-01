import "dotenv/config";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { Server, Socket } from "socket.io";
import { authRouter } from "./routes/auth";

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

const PORT = 5000;

httpServer.listen(PORT, () => {
  console.log(`>>> SERWER HTTP & WEBSOCKET URUCHOMIONY NA PORCIE ${PORT} <<<`);
});