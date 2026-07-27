import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth_endpoints";
import { pool } from "../config/db";
import { shopList } from "../../shared/ItemsList";
import { IItem } from "../../shared/types";
import crypto from "node:crypto";

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
  const playerId = req.user.userId;
  const { item } = req.body;

  if (!item || !item.id) return res.status(400).json({ message: "Brak danych" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query("SELECT gold, inventory FROM player_stats WHERE user_id = $1 FOR UPDATE", [playerId]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
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
    if (!shopItem) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Wymuszone id" });
    }

    if (shopItem.cena > currentGold) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Za mało złota" });
    }

    const newGold = currentGold - shopItem.cena;
    const isInventory = newInventory.some((dane) => dane.id === item.id && dane.poziom === item.poziom);

    let finnalInventory: IItem[];
    if (isInventory) {
      finnalInventory = newInventory.map((i) => {
        if (i.id === item.id && i.poziom === item.poziom) return { ...i, ilosc: i.ilosc + 1 };
        else return i;
      });
    } else {
      finnalInventory = [...newInventory, { ...shopItem, ilosc: 1, poziom: 0, czyzalozony: false }];
    }

    await client.query("UPDATE player_stats SET gold = $1, inventory = $2 WHERE user_id = $3", [newGold, JSON.stringify(finnalInventory), playerId]);

    await client.query("COMMIT");
    return res.status(200).json({ gold: newGold, inventory: finnalInventory });
  } catch (err) {
    await client.query("ROLLBACK");
    console.log("Błąd zakupu", err);
    res.status(500).json({ message: "Błąd - zakup przedmiotu" });
  } finally {
    client.release();
  }
});

playerRouter.post("/put-on-item", authenticateToken, async (req: AuthRequest, res) => {
  const playerId = req.user.userId;
  const { item } = req.body;
  if (!playerId || !item) return res.status(500).json({ message: "Błąd - danych wejściowych" });

  const client = await pool.connect(); // rezerwuje połaczenie
  try {
    await client.query("BEGIN");

    const result = await client.query("SELECT inventory FROM player_stats WHERE user_id = $1 FOR UPDATE", [playerId]); // Dodaje FOR UPDATE - blokuje wiersz

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
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
        if (i.id === item.id && i.poziom === item.poziom) {
          return { ...i, czyzalozony: true };
        } else return { ...i, czyzalozony: false };
      });

      await client.query("UPDATE player_stats SET inventory = $1 WHERE user_id = $2 ", [JSON.stringify(finnalInventory), playerId]);

      await client.query("COMMIT");
      return res.json({ message: `Założony przedmiot: ${item.nazwa}, który ma poziom: ${item.poziom}`, inventory: finnalInventory });
    } else {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "błąd danych wejściowych " });
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Błąd pobierania danych:", err);
    res.status(500).json({ message: "Błąd - założenie przedmiotu" });
  } finally {
    client.release();
  }
});

playerRouter.post("/take-off-item", authenticateToken, async (req: AuthRequest, res) => {
  const playerId = req.user.userId;
  const { item } = req.body;

  if (!playerId || !item) return res.status(500).json({ message: "Błąd - danych wejściowych" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query("SELECT inventory FROM player_stats WHERE user_id = $1 FOR UPDATE", [playerId]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Nie znaleziono gracza w bazie!" });
    }

    const currentInventory = result.rows[0].inventory;
    let newInventory: IItem[] = [];

    if (typeof currentInventory === "string") {
      newInventory = JSON.parse(currentInventory);
    } else if (Array.isArray(currentInventory)) {
      newInventory = currentInventory;
    }

    const isItem = newInventory.some((dane) => dane.id === item.id && dane.poziom === item.poziom && dane.czyzalozony === true); // Sprawdzenie poprwaności przesłanych danych

    if (isItem) {
      const finnalInventory = newInventory.map((i) => {
        return { ...i, czyzalozony: false };
      });
      await client.query("UPDATE player_stats SET inventory = $1 WHERE user_id = $2 ", [JSON.stringify(finnalInventory), playerId]);

      await client.query("COMMIT");
      return res.json({ message: `Zdjęto przedmiot: ${item.nazwa}, który ma poziom: ${item.poziom}`, inventory: finnalInventory });
    } else {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "błąd danych wejściowych " });
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Błąd pobierania danych:", err);
    res.status(500).json({ message: "Błąd - zdjęcia przedmiotu" });
  } finally {
    client.release();
  }
});

const mergeInventory = (inventory: IItem[]): IItem[] => {
  const map = new Map<string, IItem>();
  for (const item of inventory) {
    const key = `${item.id}_${item.poziom}`;
    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.ilosc += item.ilosc;
      if (item.czyzalozony) existing.czyzalozony = true;
    } else {
      map.set(key, { ...item });
    }
  }
  return [...map.values()].filter((i) => i.ilosc > 0);
};

playerRouter.post("/upgrade-item", authenticateToken, async (req: AuthRequest, res) => {
  const playerId: number = req.user.userId;
  const { item } = req.body;

  if (!playerId || !item) return res.status(500).json({ message: "Błąd - danych wejściowych" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query("SELECT inventory, gold FROM player_stats WHERE user_id = $1 FOR UPDATE", [playerId]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Nie znaleziono gracza w bazie!" });
    }

    const random = crypto.randomInt(1, 1000000) / 1000000;
    const flip = random > 0.5;
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
    if (currentGold < 20) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Za mało złota" });
    }
    if (!upgradeItem) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Błąd - nie znaleziono przedmiotu (fake item?)" });
    }

    if (flip) {
      if (upgradeItem.ilosc === 1) {
        finnalInventory = newInventory.map((i) => {
          if (i.id === upgradeItem.id && i.poziom === upgradeItem.poziom) {
            return { ...i, poziom: i.poziom + 1, czyzalozony: false };
          } else return { ...i };
        });
      } else if (upgradeItem.ilosc > 1) {
        finnalInventory = [...newInventory, { ...upgradeItem, ilosc: 1, poziom: upgradeItem.poziom + 1, czyzalozony: false }];
        finnalInventory = finnalInventory.map((i) => {
          if (i.id === upgradeItem.id && i.poziom === upgradeItem.poziom) {
            return { ...i, ilosc: i.ilosc - 1 };
          } else return i;
        });
      } else {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Błąd ilości - ekwipunek" });
      }

      finnalInventory = mergeInventory(finnalInventory);
      const newGold = currentGold - 20;

      await client.query("UPDATE player_stats SET gold = $1, inventory = $2  WHERE user_id = $3 ", [newGold, JSON.stringify(finnalInventory), playerId]);

      await client.query("COMMIT");
      return res.json({ message: "Ulepszenie_powiodło_się", inventory: finnalInventory, gold: newGold });
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

      await client.query("UPDATE player_stats SET gold = $1, inventory = $2  WHERE user_id = $3 ", [newGold, JSON.stringify(finnalInventory), playerId]);

      await client.query("COMMIT");
      return res.json({ message: "Spalilo", inventory: finnalInventory, gold: newGold });
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Błąd pobierania danych:", err);
    res.status(500).json({ message: "Błąd - zdjęcia przedmiotu" });
  } finally {
    client.release();
  }
});