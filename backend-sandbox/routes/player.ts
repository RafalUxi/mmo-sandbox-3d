import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth_endpoints";
import { pool } from "../config/db";

export const playerRouter = Router();

playerRouter.post("/stats", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const playerId = req.user.userId;

    const result = await pool.query("SELECT * FROM player_stats WHERE user_id = $1", [playerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Nie znaleziono gracza w bazie!" });
    }

    const playerData = result.rows[0];

    res.json({
      gold: playerData.gold,
      inventory: playerData.inventory,
    });
  } catch (err) {
    console.error("Błąd pobierania danych:", err);
    res.status(500).json({ message: "Błąd serwera bazy danych" });
  }
});
