import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";
import { SECRET_KEY } from "../config/jwt";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Za dużo prób. Spróbuj za 15 minut." },
});

export const authRouter = Router();

authRouter.post("/login", authLimiter, async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) return res.status(401).json({ message: "Błąd danych wejściowych" });
  if (typeof login !== "string" || typeof password !== "string") return res.status(401).json({ message: "Błąd danych wejściowych" });

  if (login.length > 300 || password.length > 300) return res.status(401).json({ message: "Zbyt długi login lub hasło" });

  try {
    const userResult = await pool.query("SELECT id, password_hash FROM users WHERE username = $1 ", [login]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Nieprawidłowy login lub hasło." });
    }

    const userData = userResult.rows[0];

    const isPassword = await bcrypt.compare(password, userData.password_hash);

    if (!isPassword) {
      return res.status(401).json({ message: "Nieprawidłowe hasło." });
    }

    const gameToken = jwt.sign(
      { userId: userData.id }, // Pakujemy do środka ID gracza
      SECRET_KEY,
      { expiresIn: "24h" }, // Token straci ważność po 24 godzinach
    );

    res.status(200).json({
      message: "Zalogowano pomyślnie",
      userId: userData.id,
      token: gameToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

authRouter.post("/register", authLimiter, async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) return res.status(401).json({ message: "Błąd danych wejściowych" });
  if (typeof login !== "string" || typeof password !== "string") return res.status(401).json({ message: "Błąd danych wejściowych" });

  if (login.length > 300 || password.length > 300) return res.status(401).json({ message: "Zbyt długi login lub hasło" });

  const saltRounds = 10;
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userResult = await pool.query("INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id ", [login, hashedPassword]);

    const newUserId = userResult.rows[0].id;

    await pool.query("INSERT INTO player_stats (gold, inventory, damage, user_id) VALUES ($1, $2, $3, $4)", [100, JSON.stringify([]), 25, newUserId]);

    console.log(`nowy gracz ${hashedPassword} id:  ${newUserId}`);
    res.status(200).json({ message: "Dane dotarły na serwer" });
  } catch (err) {
    res.status(400).json({ message: "Błąd rejestracji -  wpisz inne dane" });
    console.log(err);
  }
});
