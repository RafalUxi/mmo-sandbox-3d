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

export interface IMessage {
  message: string;
  sender_name: string;
  time_mess: string;
}