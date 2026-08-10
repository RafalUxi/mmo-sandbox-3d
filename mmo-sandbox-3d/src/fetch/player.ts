import { type IItem, type IShop } from "../../../shared/types";

export const fetchPlayerStats = async (token: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/player/stats`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Błąd pobierania danych");
  return res.json();
};

export const buyItem = async (item: IShop, token: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/player/inventory/buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ item }),
  });
  if (!res.ok) throw new Error("Błąd zakupu");
  return res.json();
};

export const fetchPutOnItem = async (item: IItem, token: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/player/inventory/equip`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ item }),
  });
  if (!res.ok) throw new Error("Błąd założenia przedmiotu");
  return res.json();
};

export const fetchTakeOffItem = async (item: IItem, token: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/player/inventory/unequip`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ item }),
  });
  if (!res.ok) throw new Error("Błąd odkładania przedmiotu");
  return res.json();
};

export const fetchUpgradeItem = async (item: IItem, token: string) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/player/inventory/upgrade`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ item }),
  });
  if (!res.ok) throw new Error("Błąd ulepszania");
  return res.json();
};