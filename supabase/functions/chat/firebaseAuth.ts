// Verifies a Firebase Auth ID token without the Admin SDK — ID token
// verification only needs Google's *public* signing keys, so no
// service-account credential is required for this part (unlike firestore.ts).
// Mirrors requireUser() in functions/index.js.
// Identical copy of supabase/functions/mpesa/firebaseAuth.ts — each Edge
// Function deploy is a self-contained bundle, so shared code is duplicated
// per function rather than imported across them.

const FIREBASE_PROJECT_ID = "afya-smart-377ad";
const JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let cachedKeys: { keys: Record<string, CryptoKey>; fetchedAt: number } | null = null;

function base64UrlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

// deno-lint-ignore no-explicit-any
function decodeJson(base64url: string): any {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(base64url)));
}

// Cached for an hour so a warm isolate doesn't refetch Google's JWKS on
// every request; Google rotates these keys on the order of days, not hours.
async function getSigningKeys(): Promise<Record<string, CryptoKey>> {
  const now = Date.now();
  if (cachedKeys && now - cachedKeys.fetchedAt < 60 * 60 * 1000) {
    return cachedKeys.keys;
  }

  const response = await fetch(JWKS_URL);
  if (!response.ok) throw new Error("Could not fetch Firebase signing keys.");
  const { keys: jwks } = await response.json();

  const keys: Record<string, CryptoKey> = {};
  for (const jwk of jwks) {
    keys[jwk.kid] = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
  }

  cachedKeys = { keys, fetchedAt: now };
  return keys;
}

export class AuthError extends Error {
  status = 401;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string; email?: string }> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new AuthError("Malformed ID token.");
  const [headerB64, payloadB64, signatureB64] = parts;

  const header = decodeJson(headerB64);
  const payload = decodeJson(payloadB64);

  const keys = await getSigningKeys();
  const key = keys[header.kid];
  if (!key) throw new AuthError("Unknown signing key.");

  const signature = base64UrlToBytes(signatureB64);
  const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, signedData);
  if (!valid) throw new AuthError("Invalid token signature.");

  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== FIREBASE_PROJECT_ID) throw new AuthError("Token audience mismatch.");
  if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) throw new AuthError("Token issuer mismatch.");
  if (typeof payload.exp !== "number" || payload.exp < now) throw new AuthError("Token expired.");
  if (typeof payload.iat !== "number" || payload.iat > now + 60) throw new AuthError("Token issued in the future.");
  if (!payload.sub) throw new AuthError("Token missing subject.");

  return { uid: payload.sub, email: payload.email };
}

export async function requireUser(req: Request): Promise<{ uid: string; email?: string }> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new AuthError("Unauthenticated");
  return verifyFirebaseIdToken(token);
}
