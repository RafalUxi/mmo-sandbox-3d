import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";

export const authRouter = Router();

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("BRAK KLUCZA SECRET_KEY W PLIKU .env");
}

authRouter.post("/login", async (req, res) => {
  const { chatInput_login_login, chatInput_login_password } = req.body;

  try {
    const userResult = await pool.query("SELECT id, password_hash FROM users WHERE username = $1 ", [chatInput_login_login]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Nieprawidłowy login lub hasło." });
    }

    const userData = userResult.rows[0];

    const isPassword = await bcrypt.compare(chatInput_login_password, userData.password_hash);

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
  }
});

authRouter.post("/register", async (req, res) => {
  const { chatInput_register_login, chatInput_register_password } = req.body;
  console.log(chatInput_register_login);
  const saltRounds = 10;
  try {
    const hashedPassword = await bcrypt.hash(chatInput_register_password, saltRounds);

    const userResult = await pool.query("INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id ", [chatInput_register_login, hashedPassword]);

    const newUserId = userResult.rows[0].id;

    await pool.query("INSERT INTO player_stats (gold, inventory, damage, user_id) VALUES ($1, $2, $3, $4)", [100, JSON.stringify([]), 25, newUserId]);

    console.log(`nowy gracz ${hashedPassword} id:  ${newUserId}`);
    res.status(200).json({ message: "Dane dotarły na serwer" });
  } catch (err) {
    res.status(400).json({ message: "Błąd rejestracji -  wpisz inne dane" });
    console.log(err);
  }
});
