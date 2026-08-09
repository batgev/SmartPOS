
import { getRandomBytesAsync } from "expo-crypto";
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

const ITERATIONS = 1000;
const KEY_LENGTH = 32;

/**
 * Converts a string to UTF-8 bytes.
 */
function stringToBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

/**
 * Creates a secure password hash and random salt.
 */
export async function hashPassword(
  password: string
): Promise<{ hash: string; salt: string }> {
  const saltBytes = await getRandomBytesAsync(16);

  const passwordBytes = stringToBytes(password);

  const hashBytes = pbkdf2(
    sha256,
    passwordBytes,
    saltBytes,
    {
      c: ITERATIONS,
      dkLen: KEY_LENGTH,
    }
  );

  return {
    hash: bytesToHex(hashBytes),
    salt: bytesToHex(saltBytes),
  };
}

/**
 * Verifies a password against a stored hash and salt.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  console.log("🔐 verifyPassword() started");

  const saltBytes = hexToBytes(storedSalt);

 

  const passwordBytes = stringToBytes(password);

  const calculatedHashBytes = pbkdf2(
    sha256,
    passwordBytes,
    saltBytes,
    {
      c: ITERATIONS,
      dkLen: KEY_LENGTH,
    }
  );

  const calculatedHash = bytesToHex(calculatedHashBytes);


  return calculatedHash === storedHash;
}

