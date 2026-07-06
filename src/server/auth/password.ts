import {
  randomBytes,
  scrypt as scryptCallback,
  type ScryptOptions,
  timingSafeEqual,
} from "node:crypto";

const HASH_PREFIX = "scrypt";
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_MAX_MEM = 64 * 1024 * 1024;

function scrypt(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    p: SCRYPT_P,
    r: SCRYPT_R,
    maxmem: SCRYPT_MAX_MEM,
  });

  return [
    HASH_PREFIX,
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  try {
    const [prefix, nValue, rValue, pValue, saltValue, keyValue] = passwordHash.split("$");

    if (prefix !== HASH_PREFIX || !nValue || !rValue || !pValue || !saltValue || !keyValue) {
      return false;
    }

    const n = Number.parseInt(nValue, 10);
    const r = Number.parseInt(rValue, 10);
    const p = Number.parseInt(pValue, 10);

    if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) {
      return false;
    }

    const salt = Buffer.from(saltValue, "base64url");
    const expectedKey = Buffer.from(keyValue, "base64url");
    const actualKey = await scrypt(password, salt, expectedKey.length, {
      N: n,
      p,
      r,
      maxmem: SCRYPT_MAX_MEM,
    });

    if (actualKey.length !== expectedKey.length) {
      return false;
    }

    return timingSafeEqual(actualKey, expectedKey);
  } catch {
    return false;
  }
}
