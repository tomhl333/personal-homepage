import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const adminCookieName = "personal_homepage_admin";

const maxAgeSeconds = 60 * 60 * 24 * 14;

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function verifyAdminPassword(password: string) {
  const configured = process.env.ADMIN_PASSWORD;

  if (!configured) {
    return false;
  }

  return safeEqual(password, configured);
}

export function createAdminSession() {
  const expires = Date.now() + maxAgeSeconds * 1000;
  const payload = `admin.${expires}`;
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function verifyAdminSession(value?: string) {
  if (!value || !sessionSecret()) {
    return false;
  }

  const parts = value.split(".");

  if (parts.length !== 3) {
    return false;
  }

  const [role, expires, signature] = parts;
  const payload = `${role}.${expires}`;

  if (role !== "admin" || Number(expires) < Date.now()) {
    return false;
  }

  return safeEqual(signature, sign(payload));
}

export function isAdminRequest(request: NextRequest) {
  return verifyAdminSession(request.cookies.get(adminCookieName)?.value);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    maxAge: maxAgeSeconds,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
