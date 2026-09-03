// Minimal Firestore REST client authenticated as a Google service account.
// Identical copy of supabase/functions/mpesa/firestore.ts — see that file's
// header comment for why the REST API is used instead of firebase-admin, and
// why this is duplicated per function rather than shared via import.

const FIREBASE_PROJECT_ID = "afya-smart-377ad";
// Resource-name form (no https://.../v1/ prefix) — required by the :commit
// endpoint's Write.transform.document field, which rejects a full URL there.
const FIRESTORE_RESOURCE_ROOT = `projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/${FIRESTORE_RESOURCE_ROOT}`;

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) {
    return cachedToken.accessToken;
  }

  const clientEmail = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_EMAIL");
  const privateKeyRaw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY");
  if (!clientEmail || !privateKeyRaw) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_EMAIL/FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY secrets.");
  }
  const privateKeyPem = privateKeyRaw.replace(/\\n/g, "\n");

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/datastore",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claims}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64url(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Could not get Google OAuth2 token: ${await response.text()}`);
  }

  const data = await response.json();
  cachedToken = { accessToken: data.access_token, expiresAt: now + data.expires_in };
  return cachedToken.accessToken;
}

// deno-lint-ignore no-explicit-any
function encodeValue(value: any): any {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (typeof value === "object") {
    return {
      mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encodeValue(v)])) },
    };
  }
  throw new Error(`Cannot encode Firestore value of type ${typeof value}`);
}

// deno-lint-ignore no-explicit-any
function decodeValue(value: any): any {
  if (!value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return new Date(value.timestampValue);
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in value) return decodeFields(value.mapValue.fields || {});
  return null;
}

// deno-lint-ignore no-explicit-any
function decodeFields(fields: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decodeValue(v)]));
}

async function firestoreFetch(suffix: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  return fetch(`${FIRESTORE_BASE}${suffix}`, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
}

// deno-lint-ignore no-explicit-any
export async function getDoc(path: string): Promise<Record<string, any> | null> {
  const response = await firestoreFetch(`/${path}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore getDoc(${path}) failed: ${await response.text()}`);
  const data = await response.json();
  return decodeFields(data.fields || {});
}

// deno-lint-ignore no-explicit-any
export async function setDoc(path: string, data: Record<string, any>): Promise<void> {
  const fields = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, encodeValue(v)]));
  const mask = Object.keys(data).map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`).join("&");
  const response = await firestoreFetch(`/${path}?${mask}`, { method: "PATCH", body: JSON.stringify({ fields }) });
  if (!response.ok) throw new Error(`Firestore setDoc(${path}) failed: ${await response.text()}`);
}

// deno-lint-ignore no-explicit-any
export async function addDoc(collectionPath: string, data: Record<string, any>): Promise<string> {
  const fields = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, encodeValue(v)]));
  const response = await firestoreFetch(`/${collectionPath}`, { method: "POST", body: JSON.stringify({ fields }) });
  if (!response.ok) throw new Error(`Firestore addDoc(${collectionPath}) failed: ${await response.text()}`);
  const created = await response.json();
  return String(created.name).split("/").pop()!;
}

// Atomic numeric increments via the :commit transform API, mirroring
// `FieldValue.increment(...)`.
export async function incrementFields(path: string, deltas: Record<string, number>): Promise<void> {
  // deno-lint-ignore no-explicit-any
  const fieldTransforms: any[] = Object.entries(deltas).map(([fieldPath, delta]) => ({
    fieldPath,
    increment: Number.isInteger(delta) ? { integerValue: String(delta) } : { doubleValue: delta },
  }));
  fieldTransforms.push({ fieldPath: "updated_at", setToServerValue: "REQUEST_TIME" });

  const response = await firestoreFetch(":commit", {
    method: "POST",
    body: JSON.stringify({
      writes: [{ transform: { document: `${FIRESTORE_RESOURCE_ROOT}/${path}`, fieldTransforms } }],
    }),
  });
  if (!response.ok) throw new Error(`Firestore incrementFields(${path}) failed: ${await response.text()}`);
}
