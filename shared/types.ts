export interface IItem {
  id: number;
  nazwa: string;
  typ: "Broń";
  ilosc: number;
  poziom: number;
}

export interface IShop {
  id: number;
  nazwa: string;
  typ: "Broń";
  cena: number;
}