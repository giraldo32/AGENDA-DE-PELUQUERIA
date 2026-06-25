import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const COOKIE_NAME = "agenda_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "development-secret-change-me";
}

function sign(payload: string) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

function encodeSession(usuario: string) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = JSON.stringify({ usuario, expiresAt });
  const body = Buffer.from(payload).toString("base64url");
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");
  if (!body || !signature || signature !== sign(body)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      usuario?: string;
      expiresAt?: number;
    };

    if (!payload.usuario || !payload.expiresAt || payload.expiresAt < Date.now()) {
      return null;
    }

    return payload.usuario;
  } catch {
    return null;
  }
}

export async function authenticateAdmin(usuario: string, contrasena: string) {
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin";

  if (usuario !== adminUsername || contrasena !== adminPassword) {
    return null;
  }

  return encodeSession(usuario);
}

export async function setAdminCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function isAdminPasswordValid(contrasenaHash: string, contrasena: string) {
  return bcrypt.compare(contrasena, contrasenaHash);
}

export async function getAdminSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
