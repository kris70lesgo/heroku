import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  gradeLevel?: string;
  subjects?: string[];
  learningGoals?: string;
  createdAt: number;
}

interface UserRecord extends UserProfile {
  passwordHash: string;
}

const users = new Map<string, UserRecord>(); // key: email

const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret-change";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const withCookies = cookieParser();

function sign(user: UserProfile) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = (req.cookies?.token as string) || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : undefined);
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
    const user = Array.from(users.values()).find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    (req as any).user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export async function register(req: Request, res: Response) {
  const { email, password, name, gradeLevel, subjects, learningGoals } = req.body ?? {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (users.has(email)) {
    return res.status(409).json({ error: "User already exists" });
  }
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const record: UserRecord = {
    id,
    email,
    name,
    gradeLevel,
    subjects: Array.isArray(subjects) ? subjects : undefined,
    learningGoals,
    passwordHash,
    createdAt: Date.now(),
  };
  users.set(email, record);
  const token = sign(record);
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  const { passwordHash: _ph, ...safe } = record;
  return res.json({ user: safe, token });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "Missing credentials" });
  const user = users.get(email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = sign(user);
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  const { passwordHash: _ph, ...safe } = user;
  return res.json({ user: safe, token });
}

export function me(req: Request, res: Response) {
  const token = (req.cookies?.token as string) || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : undefined);
  if (!token) return res.status(200).json({ user: null });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
    const user = Array.from(users.values()).find((u) => u.id === payload.sub);
    if (!user) return res.status(200).json({ user: null });
    const { passwordHash: _ph, ...safe } = user;
    return res.json({ user: safe });
  } catch (e) {
    return res.status(200).json({ user: null });
  }
}

export function logout(_req: Request, res: Response) {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return res.json({ ok: true });
}
