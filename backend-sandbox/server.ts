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
import { IItem } from "../shared/types";
import { SECRET_KEY } from "./config/jwt";

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
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH"],
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
  let lastSendMessage = 0;
  let lastAddFriends = 0;
  let lastHit = 0;

  socket.on("sendMessageMove", (dane) => {
    try {
      io.emit("playerMove", { id: socket.id, x: dane.x, y: dane.y, z: dane.z, action: dane.action, rotation: dane.rotation, weapon: dane.weapon });
    } catch {
      console.log("Błąd socket");
    }
  });

  socket.on("AddFriends", async (dane) => {
    if (!dane.name) return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd danych wejściowych" });
    if (typeof dane.name !== "string") return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd typów danych wejściowych" });

    const now = Date.now();
    if (now - lastAddFriends < 1000) return socket.emit("addFriendsResult", { success: false, type: "error", message: "Spam" });
    lastAddFriends = now;

    const friendName = dane.name;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (!socket.userId) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd id socketa" });
      }

      // Pierwsze sprawdzenie czy dodano samego siebie
      const resultName = await client.query("SELECT username FROM users WHERE id = $1 ", [socket.userId]);
      if (resultName.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd odczytu danych z bazy" });
      }

      if (resultName.rows[0].username === friendName) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Dodano samego siebie" });
      }

      // Odczyt id targetu
      const resultsAdd = await client.query("SELECT id FROM users WHERE username = $1 ", [friendName]);
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

      const friends_list: string[] = friends_list_results.rows[0].friends_list ?? [];

      if (friends_list.includes(friendName)) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Już jesteście w znajomych" });
      }

      const targetData = resultsAdd.rows[0].id; // id gracza - target
      const targetSocketId = connectionUsers.get(targetData); // id socketu - target

      // Pobranie nazwy gracza - sender
      const playerName = await client.query("SELECT username FROM users WHERE id = $1 ", [socket.userId]);
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
    if (typeof dane.nameSender !== "string") return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd typów danych wejściowych" });
    const friendName = dane.nameSender;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (!socket.userId) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd socketa" });
      }
      // Odczyt nazwy - target
      const resultTarget = await client.query("SELECT username FROM users WHERE id = $1", [socket.userId]);
      if (resultTarget.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd odczytu danych z bazy" });
      }

      // Weryfikacja nazawy Sendera - czyli pobranie id Sender
      const resultSender = await client.query("SELECT id FROM users WHERE username = $1", [friendName]);
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
        await client.query("UPDATE player_stats SET friend_requests = array_remove(friend_requests, $1) WHERE user_id = $2", [socket.userId, senderId]); // Usunięcie znacznika zaproszenia
        const update_list_sender = await client.query("UPDATE player_stats SET friends_list = array_append(friends_list, $1) WHERE user_id = $2 AND NOT ($1 = ANY(COALESCE(friends_list, '{}'::text[]))) RETURNING friends_list", [targetName, senderId]);
        const update_list_target = await client.query("UPDATE player_stats SET friends_list = array_append(friends_list, $1) WHERE user_id = $2 AND NOT ($1 = ANY(COALESCE(friends_list, '{}'::text[]))) RETURNING friends_list", [friendName, socket.userId]);
        if (update_list_sender.rows.length === 0 || update_list_target.rows.length === 0) {
          await client.query("ROLLBACK");
          return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd odczytu danych" });
        }

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
    if (typeof dane.nameSender !== "string") return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd typów danych wejściowych" });

    const friendName = dane.nameSender;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (!socket.userId) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "error", message: "Błąd socketa" });
      }

      // Weryfikacja nazawy Sendera - czyli pobranie id Sender
      const resultSender = await client.query("SELECT id FROM users WHERE username = $1", [friendName]);
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

  socket.on("StartChat", async (dane) => {
    if (!dane.name) return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Błąd danych wejściowych" });
    if (typeof dane.name !== "string") return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Błąd typów danych wejściowych" });

    const friendName = dane.name;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (!socket.userId) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Błąd socketa" });
      }

      // Weryfikacja nazwy użytkownika - potrzebne do stworzenia pokoju
      const resultName = await client.query("SELECT id FROM users WHERE username = $1", [friendName]);
      if (resultName.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Błędna nazwa użytkownika (wymuszenie?)" });
      }

      // Sprawdzenie czy gracze mają siebie w znajomych
      const resultFriends = await client.query("SELECT friends_list FROM player_stats WHERE user_id = $1 FOR UPDATE", [socket.userId]);
      if (resultFriends.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Błąd odczytu danych z bazy" });
      }

      if (!resultFriends.rows[0].friends_list.includes(friendName)) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Gracze nie są w znajomych (wymuszenie?)" });
      }

      const targetId = resultName.rows[0].id;
      const room = `chat_${Math.max(socket.userId, targetId)}_${Math.min(socket.userId, targetId)}`;
      socket.rooms.forEach((r) => {
        if (r.startsWith("chat_")) socket.leave(r);
      });
      socket.join(room);

      // Pobranie message
      const result = await client.query(
        `SELECT m.id, m.message, u.username AS sender_name, m.time_mess
         FROM message m
         JOIN users u ON u.id = m.sender_id
         WHERE m.room = $1
         ORDER BY m.time_mess ASC
         LIMIT 50`,
        [room],
      );

      await client.query("COMMIT");
      return socket.emit("roomMessages", { success: true, messages: result.rows, room: room });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Błąd pobierania danych:", err);
      return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Błąd pobierania danych" });
    } finally {
      client.release();
    }
  });

  socket.on("SendMessage", async (dane) => {
    if (!dane.message || !dane.room || !dane.targetName) return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Błąd danych wejściowych" });
    if (typeof dane.message !== "string" || typeof dane.room !== "string" || typeof dane.targetName !== "string") return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Błąd typów danych wejściowych" }); // Wlidacji typów wejścia
    const message = dane.message;
    if (message.length > 300) return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Zbyt długa wiadomość" });
    const now = Date.now();
    if (now - lastSendMessage < 1000) return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Spam" });
    lastSendMessage = now;

    const targetName = dane.targetName;
    const room = dane.room;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (!socket.userId) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "erroChat", message: "Błąd socketa" });
      }

      // Sprawdzenie czy gracze mają siebie w znajomych
      const resultFriends = await client.query("SELECT friends_list FROM player_stats WHERE user_id = $1 FOR UPDATE", [socket.userId]);
      if (resultFriends.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Błąd odczytu danych z bazy" });
      }

      if (!resultFriends.rows[0].friends_list.includes(targetName)) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Gracze nie są w znajomych (wymuszenie?)" });
      }

      // Jeśli są w znajomych odkoduj pokój i sprawdz jego poprawność
      const resultTarget = await client.query("SELECT id FROM users WHERE username = $1", [targetName]);
      if (resultTarget.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Błąd odczytu danych z bazy" });
      }

      const roomCheck = `chat_${Math.max(socket.userId, resultTarget.rows[0].id)}_${Math.min(socket.userId, resultTarget.rows[0].id)}`;
      if (roomCheck !== room) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Błędny pokój (wymuszenie?)" });
      }

      await client.query("INSERT INTO message (message, room, sender_id) VALUES ($1, $2, $3)", [message, room, socket.userId]);

      const usernameResults = await client.query("SELECT username FROM users WHERE id = $1 ", [socket.userId]);
      if (usernameResults.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Błąd odczytu danych z bazy" });
      }

      await client.query("COMMIT");
      return io.to(room).emit("newMessage", {
        message: message,
        sender_name: usernameResults.rows[0].username,
        time_mess: new Date(),
        room: room,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Błąd pobierania danych:", err);
      return socket.emit("addFriendsResult", { success: false, type: "errorChat", message: "Błąd pobierania danych" });
    } finally {
      client.release();
    }
  });

  socket.on("hitobj", async (dane) => {
    if (!dane.type) return socket.emit("hitObjResults", { success: false, type: "error", message: "Błąd danych wejściowych" });
    if (typeof dane.x !== "number" || typeof dane.y !== "number" || typeof dane.z !== "number") return socket.emit("hitObjResults", { success: false, type: "error", message: "Błąd danych wejściowych" });

    // Ochorna przed spam hackiem
    const now = Date.now();
    if (now - lastHit < 1000) return socket.emit("hitObjResults", { success: false, type: "errorChat", message: "Spam" });
    lastHit = now;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (!socket.userId) {
        await client.query("ROLLBACK");
        return socket.emit("hitObjResults", { success: false, type: "error", message: "Błąd socketa" });
      }

      // Wymuszaenie -  wywołanie eventu z daleka
      const BossPos = { x: 9, y: -1.2, z: 14 };
      const dx = dane.x - BossPos.x;
      const dy = dane.y - BossPos.y;
      const dz = dane.z - BossPos.z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) > 8) {
        await client.query("ROLLBACK");
        return socket.emit("hitObjResults", { success: false, type: "error", message: "Za daleko od bossa" });
      }

      // Pobranie założonej broni
      const swordResults = await client.query("SELECT inventory FROM player_stats WHERE user_id = $1 FOR UPDATE", [socket.userId]);
      if (swordResults.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("hitObjResults", { success: false, type: "error", message: "Błąd odczytu danych z bazy" });
      }

      // Wyciągnięcie broni i obliczenie zadanych obrazen
      let dmg;
      const sword: IItem = swordResults.rows[0].inventory.find((item: IItem) => item.czyzalozony === true);
      if (sword) {
        if (sword.nazwa === "Długi Miecz") {
          dmg = (sword.obrazenia ?? 0) + ((sword.poziom ?? 0) + 1) * 10 * 1;
        } else if (sword.nazwa === "Miecz Dusz") {
          dmg = (sword.obrazenia ?? 0) + ((sword.poziom ?? 0) + 1) * 10 * 2;
        } else if (sword.nazwa === "Monolit Slayer") {
          dmg = (sword.obrazenia ?? 0) + ((sword.poziom ?? 0) + 1) * 10 * 3;
        } else dmg = 10;
      } else dmg = 10;

      // Update - obrazen
      const targetResults = await client.query("SELECT hp, maxhp, rewardgold, hitted FROM boss_stats WHERE name = $1 FOR UPDATE", ["monolit"]);
      if (targetResults.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("hitObjResults", { success: false, type: "error", message: "Błąd odczytu danych z bazy" });
      }
      const currentHp = targetResults.rows[0].hp;
      const maxHp = targetResults.rows[0].maxhp;
      const rewardGold = targetResults.rows[0].rewardgold;
      const hitted: number[] = targetResults.rows[0].hitted ?? [];

      let newHp = currentHp - dmg;

      if (hitted.includes(socket.userId)) {
        await client.query("UPDATE boss_stats SET hp = $1 WHERE name = $2", [newHp, "monolit"]);
      } else {
        await client.query("UPDATE boss_stats SET hp = $1, hitted = array_append(hitted, $2) WHERE name = $3", [newHp, socket.userId, "monolit"]);
      }

      const finalHitted = hitted.includes(socket.userId) ? hitted : [...hitted, socket.userId];

      // Event - zbity monolit
      if (newHp <= 0) {
        console.log("Monolit został zbity");
        await client.query("UPDATE boss_stats SET hp = $1, hitted = $2 WHERE name = $3", [maxHp, [], "monolit"]);
        for (const id of finalHitted) {
          await client.query("UPDATE player_stats SET gold = gold + $1 WHERE user_id = $2", [rewardGold, id]);
        }
        await client.query("COMMIT");
        return io.emit("hitObjResults", { success: true, type: "setGold", message: "Monolit zbity", hp: maxHp });
      }

      await client.query("COMMIT");
      return io.emit("hitObjResults", { success: true, type: "hit", message: "Poprawnie uderzono", hp: newHp });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Błąd pobierania danych:", err);
      return socket.emit("hitObjResults", { success: false, type: "error", message: "Błąd pobierania danych" });
    } finally {
      client.release();
    }
  });

  socket.on("setGold", async (dane) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const goldResults = await client.query("SELECT gold FROM player_stats WHERE user_id = $1 FOR UPDATE", [socket.userId]);
      if (goldResults.rows.length === 0) {
        await client.query("ROLLBACK");
        return socket.emit("setGoldResults", { success: false, type: "error", message: "Błąd odczytu danych z bazy" });
      }
      const currentGold = goldResults.rows[0].gold;

      await client.query("COMMIT");
      return socket.emit("setGoldResults", { success: true, message: "Poprawnie zaktualizowano stan golda", gold: currentGold });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Błąd pobierania danych:", err);
      return socket.emit("hitObjResults", { success: false, type: "error", message: "Błąd pobierania danych" });
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