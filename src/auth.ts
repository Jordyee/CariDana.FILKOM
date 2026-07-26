const encoder = new TextEncoder();

export async function derivePbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
}

export async function issueSyntheticSessionCookie(): Promise<string> {
  const token = crypto.getRandomValues(new Uint8Array(32));
  const digest = await crypto.subtle.digest("SHA-256", token);
  // This spike proves only cookie construction and token hashing; it stores no session.
  const value = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `spike_session=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`;
}
