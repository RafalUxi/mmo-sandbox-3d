import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config/jwt";

export interface AuthRequest extends Request {
  user?: { userId: number };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Brak dostępu. Zaloguj się!" });
    return;
  }

  jwt.verify(token, SECRET_KEY, (err, decodedUser) => {
    if (err) {
      res.status(403).json({ message: "Token jest nieważny lub wygasł." });
      return;
    }

    req.user = decodedUser as { userId: number };
    next();
  });
};