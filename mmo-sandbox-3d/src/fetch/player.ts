export interface IShop {
  id: number;
  nazwa: string;
  typ: "Broń";
  cena: number;
}

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