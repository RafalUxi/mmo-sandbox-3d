export interface IItem {
  id: number;
  nazwa: string;
  typ: "Broń";
  ilosc: number;
  poziom: number;
  obrazenia: number;
  czyzalozony: boolean;
}

export interface IShop {
  id: number;
  nazwa: string;
  typ: "Broń";
  cena: number;
  poziom: number;
  obrazenia: number;
}