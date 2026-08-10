const key = process.env.SECRET_KEY;

if (!key) {
  throw new Error("BRAK KLUCZA SECRET_KEY W PLIKU .env");
}

export const SECRET_KEY: string = key;
