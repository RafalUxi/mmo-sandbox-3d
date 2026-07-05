export const fetchPlayerStats = async (token: string) => {
  const res = await fetch("http://localhost:5000/player/stats", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Błąd pobierania danych");
  return res.json();
};
