import { type IItem, type IShop } from "../../../shared/types";

export const fetchPlayerStats = async (token: string) => {
  const res = await fetch("http://localhost:5000/player/stats", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Błąd pobierania danych");
  return res.json();
};

export const buyItem = async (item: IShop, token: string) => {
  const res = await fetch("http://localhost:5000/player/buy-item", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ item }),
  });
  if (!res.ok) throw new Error("Błąd zakupu");
  return res.json();
};

export const fetchPutOnItem = async (item: IItem, token: string) => {
  const res = await fetch("http://localhost:5000/player/put-on-item", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ item }),
  });
  if (!res.ok) throw new Error("Błąd założenia przedmiotu");
  return res.json();
};

export const fetchTakeOffItem = async (item: IItem, token: string) => {
  const res = await fetch("http://localhost:5000/player/take-off-item", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ item }),
  });
  if (!res.ok) throw new Error("Błąd odkładania przedmiotu");
  return res.json();
};
