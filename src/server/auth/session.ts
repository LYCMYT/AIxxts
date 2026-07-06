export const SESSION_COOKIE_NAME = "aixxts_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type SessionRole = "ADMIN" | "READER";

export type SessionPayload = {
  exp: number;
  role: SessionRole;
  userId: string;
};

type UnsignedSessionPayload = Omit<SessionPayload, "exp">;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSessionSecret(secret?: string): string {
  const value = secret ?? process.env.SESSION_SECRET;

  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters.");
  }

  return value;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function importHmacKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    usages,
  );
}

async function signPayloadSegment(payloadSegment: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadSegment));

  return base64UrlEncode(new Uint8Array(signature));
}

function decodePayload(payloadSegment: string): unknown {
  return JSON.parse(decoder.decode(base64UrlDecode(payloadSegment)));
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<SessionPayload>;

  return (
    typeof payload.exp === "number" &&
    Number.isInteger(payload.exp) &&
    typeof payload.userId === "string" &&
    payload.userId.length > 0 &&
    (payload.role === "ADMIN" || payload.role === "READER")
  );
}

export async function createSessionToken(
  payload: UnsignedSessionPayload,
  secret?: string,
  now = new Date(),
  maxAgeSeconds = SESSION_MAX_AGE_SECONDS,
): Promise<string> {
  const sessionPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(now.getTime() / 1000) + maxAgeSeconds,
  };
  const payloadSegment = base64UrlEncode(encoder.encode(JSON.stringify(sessionPayload)));
  const signatureSegment = await signPayloadSegment(payloadSegment, getSessionSecret(secret));

  return `${payloadSegment}.${signatureSegment}`;
}

export async function verifySessionToken(
  token: string | null | undefined,
  secret?: string,
  now = new Date(),
): Promise<SessionPayload | null> {
  try {
    if (!token) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [payloadSegment, signatureSegment] = parts;

    if (!payloadSegment || !signatureSegment) {
      return null;
    }

    const signature = base64UrlDecode(signatureSegment);
    const key = await importHmacKey(getSessionSecret(secret), ["verify"]);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      toArrayBuffer(signature),
      encoder.encode(payloadSegment),
    );

    if (!valid) {
      return null;
    }

    const payload = decodePayload(payloadSegment);

    if (!isSessionPayload(payload)) {
      return null;
    }

    if (payload.exp <= Math.floor(now.getTime() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function getExpiredSessionCookieOptions() {
  return getSessionCookieOptions(0);
}
