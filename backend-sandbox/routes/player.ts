import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth_endpoints";
import { pool } from "../config/db";
import { shopList } from "../../shared/ItemsList";
import { IItem } from "../../shared/types";

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
    res.status(500).json({ message: "Błąd - odczyt statystyk gracza" });
  }
});

playerRouter.post("/buy-item", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const playerId = req.user.userId;
    const { item } = req.body;

    if (!item || !item.id) return res.status(400).json({ message: "Brak danych" });

    const result = await pool.query("SELECT gold, inventory FROM player_stats WHERE user_id = $1", [playerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Nie znaleziono gracza w bazie!" });
    }

    const currentGold: number = result.rows[0].gold;
    const currentInventory = result.rows[0].inventory;
    let newInventory: IItem[] = [];

    if (typeof currentInventory === "string") {
      newInventory = JSON.parse(currentInventory);
    } else if (Array.isArray(currentInventory)) {
      newInventory = currentInventory;
    }

    const shopItem = shopList.find((dane) => dane.id === item.id);
    if (!shopItem) return res.status(404).json({ message: "Wymuszone id" });

    if (shopItem.cena <= currentGold) {
      const newGold = currentGold - shopItem.cena;
      const isInventory = newInventory.some((dane) => dane.id === item.id && dane.poziom === item.poziom); // Tutaj sprawdzam czy kupowany item to powtórka

      if (isInventory) {
        const finnalInventory_inc = newInventory.map((i) => {
          if (i.id === item.id && i.poziom === item.poziom) {
            return { ...i, ilosc: i.ilosc + 1 };
          } else return i;
        });

        await pool.query("UPDATE player_stats SET gold = $1, inventory = $2 WHERE user_id = $3 ", [newGold, JSON.stringify(finnalInventory_inc), playerId]);

        return res.status(200).json({
          gold: newGold,
          inventory: finnalInventory_inc,
        });
      } else {
        const finnalInventory_add = [...newInventory, { ...shopItem, ilosc: 1, poziom: 0 }];

        await pool.query("UPDATE player_stats SET gold = $1, inventory = $2 WHERE user_id = $3 ", [newGold, JSON.stringify(finnalInventory_add), playerId]);

        return res.status(200).json({
          gold: newGold,
          inventory: finnalInventory_add,
        });
      }
    } else {
      res.status(400).json({ message: "Za mało złota" });
    }
  } catch (err) {
    console.log("Błąd zakupu", err);
    res.status(500).json({ message: "Błąd - zakup przedmiotu" });
  }
});

playerRouter.post("/put-on-item", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const playerId = req.user.userId;
    const { item } = req.body;

    if (!playerId || !item) return res.status(500).json({ message: "Błąd - danych wejściowych" });

    const result = await pool.query("SELECT inventory FROM player_stats WHERE user_id = $1", [playerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Nie znaleziono gracza w bazie!" });
    }

    const currentInventory = result.rows[0].inventory;
    let newInventory: IItem[] = [];

    if (typeof currentInventory === "string") {
      newInventory = JSON.parse(currentInventory);
    } else if (Array.isArray(currentInventory)) {
      newInventory = currentInventory;
    }

    const isItem = newInventory.some((dane) => dane.id === item.id && dane.poziom === item.poziom); // Sprawdzenie poprwaności przesłanych danych
    console.log(item);

    if (isItem) {
      const finnalInventory = newInventory.map((i) => {
        if (i.id === item.id && i.poziom === item.poziom) {
          return { ...i, czyzalozony: true };
        } else return { ...i, czyzalozony: false };
      });

      await pool.query("UPDATE player_stats SET inventory = $1 WHERE user_id = $2 ", [JSON.stringify(finnalInventory), playerId]);

      res.json({ message: `Założony przedmiot: ${item.nazwa}, który ma poziom: ${item.poziom}` });
    } else {
      res.status(400).json({ message: "błąd danych wejściowych " });
    }
  } catch (err) {
    console.error("Błąd pobierania danych:", err);
    res.status(500).json({ message: "Błąd - założenie przedmiotu" });
  }
});

playerRouter.post("/take-off-item", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const playerId = req.user.userId;
    const { item } = req.body;

    if (!playerId || !item) return res.status(500).json({ message: "Błąd - danych wejściowych" });

    const result = await pool.query("SELECT inventory FROM player_stats WHERE user_id = $1", [playerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Nie znaleziono gracza w bazie!" });
    }

    const currentInventory = result.rows[0].inventory;
    let newInventory: IItem[] = [];

    if (typeof currentInventory === "string") {
      newInventory = JSON.parse(currentInventory);
    } else if (Array.isArray(currentInventory)) {
      newInventory = currentInventory;
    }

    const isItem = newInventory.some((dane) => dane.id === item.id && dane.poziom === item.poziom); // Sprawdzenie poprwaności przesłanych danych

    if (isItem) {
      const finnalInventory = newInventory.map((i) => {
        return { ...i, czyzalozony: false };
      });
      await pool.query("UPDATE player_stats SET inventory = $1 WHERE user_id = $2 ", [JSON.stringify(finnalInventory), playerId]);

      res.json({ inventory: finnalInventory });
    } else {
      res.status(400).json({ message: "błąd danych wejściowych " });
    }
  } catch (err) {
    console.error("Błąd pobierania danych:", err);
    res.status(500).json({ message: "Błąd - zdjęcia przedmiotu" });
  }
});

const mergeInventory = (inventory: IItem[]): IItem[] => {
  const map = new Map<string, IItem>();
  for (const item of inventory) {
    const key = `${item.id}_${item.poziom}`;
    if (map.has(key)) {
      map.get(key)!.ilosc += item.ilosc;
    } else {
      map.set(key, { ...item });
    }
  }
  return [...map.values()].filter((i) => i.ilosc > 0);
};

playerRouter.post("/upgrade-item", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const playerId = req.user.userId;
    const { item } = req.body;

    if (!playerId || !item) return res.status(500).json({ message: "Błąd - danych wejściowych" });

    const result = await pool.query("SELECT inventory, gold FROM player_stats WHERE user_id = $1", [playerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Nie znaleziono gracza w bazie!" });
    }

    const flip = Math.random() > 0.5;
    const currentGold = result.rows[0].gold;
    const currentInventory = result.rows[0].inventory;
    let newInventory: IItem[] = [];
    let finnalInventory: IItem[] = [];

    if (typeof currentInventory === "string") {
      newInventory = JSON.parse(currentInventory);
    } else if (Array.isArray(currentInventory)) {
      newInventory = currentInventory;
    }

    const upgradeItem = newInventory.find((dane) => dane.id === item.id && dane.poziom === item.poziom);
    if (!upgradeItem) return res.status(400).json({ message: "Błąd - nie znaleziono przedmiotu (fake item?)" });

    if (flip) {
      if (upgradeItem.ilosc === 1) {
        finnalInventory = newInventory.map((i) => {
          if (i.id === upgradeItem.id && i.poziom === upgradeItem.poziom) {
            return { ...i, poziom: i.poziom + 1 };
          } else return { ...i };
        });
      } else if (upgradeItem.ilosc > 1) {
        finnalInventory = [...newInventory, { ...upgradeItem, ilosc: 1, poziom: upgradeItem.poziom + 1 }];
        finnalInventory = finnalInventory.map((i) => {
          if (i.id === upgradeItem.id && i.poziom === upgradeItem.poziom) {
            return { ...i, ilosc: i.ilosc - 1 };
          } else return i;
        });
      }

      finnalInventory = mergeInventory(finnalInventory);
      const newGold = currentGold - 20;

      await pool.query("UPDATE player_stats SET gold = $1, inventory = $2  WHERE user_id = $3 ", [newGold, JSON.stringify(finnalInventory), playerId]);

      res.json({ message: "Ulepszenie powiodło się!", inventory: finnalInventory, gold: newGold });
    } else {
      finnalInventory = newInventory
        .map((i) => {
          if (i.id === item.id && i.poziom === item.poziom) {
            return { ...i, ilosc: i.ilosc - 1 };
          } else return { ...i };
        })
        .filter((i) => i.ilosc > 0);

      finnalInventory = mergeInventory(finnalInventory);
      const newGold = currentGold - 20;

      await pool.query("UPDATE player_stats SET gold = $1, inventory = $2  WHERE user_id = $3 ", [newGold, JSON.stringify(finnalInventory), playerId]);

      res.json({ message: "Spaliło!", inventory: finnalInventory, gold: newGold });
    }
  } catch (err) {
    console.error("Błąd pobierania danych:", err);
    res.status(500).json({ message: "Błąd - zdjęcia przedmiotu" });
  }
});