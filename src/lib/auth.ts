import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signJwt(payload: object, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export async function getUserFromToken(token: string) {
  const decoded = verifyJwt(token) as any;
  if (!decoded?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  return user;
}

export function requireRoleFromPayload(payload: any, allowed: string[] = []) {
  if (!payload) throw new Error("Unauthorized");
  if (!allowed.includes(payload.role)) throw new Error("Forbidden: insufficient role");
}

export function getBearerTokenFromRequest(req: Request) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) return null;
  const parts = auth.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") return parts[1];
  return null;
}

export function getJwtPayload(token: string) {
  const decoded = verifyJwt(token);
  return decoded as any;
}

export default {
  hashPassword,
  verifyPassword,
  signJwt,
  verifyJwt,
  getUserFromToken,
  getBearerTokenFromRequest,
  getJwtPayload,
};
