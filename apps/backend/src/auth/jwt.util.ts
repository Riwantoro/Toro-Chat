import jwt, { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET: Secret = process.env.JWT_SECRET ?? "dev-secret";
const JWT_EXPIRES_IN: any = process.env.JWT_EXPIRES_IN ?? "7d";

export interface JwtPayload {
  sub: string;
  role: "admin" | "user";
}

export function signToken(payload: JwtPayload) {
  // Casts to satisfy jsonwebtoken overloads across TS versions/DT packages.
  return jwt.sign(payload as jwt.JwtPayload, JWT_SECRET as Secret, {
    expiresIn: JWT_EXPIRES_IN
  } as SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
