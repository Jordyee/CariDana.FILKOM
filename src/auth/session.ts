import { SessionRepository } from "../repositories/sessions";

export const SESSION_COOKIE = "__Host-caridana";
export const NORMAL_LIFETIME_MS = 8 * 60 * 60 * 1000;
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const RESTRICTED_LIFETIME_MS = 10 * 60 * 1000;
const tokenPattern = /^[a-f0-9]{64}$/;
const csrfMessage = new TextEncoder().encode("caridana.csrf.v1");

export interface IssuedSession { id: string; token: string; expiresAt: number }

/** Internal service: only a successful credential verifier may call issue(). */
export class SessionService {
  private readonly repository: SessionRepository;
  constructor(db: D1Database, private readonly clock: () => number = Date.now) {
    this.repository = new SessionRepository(db);
  }

  /** expectedVersion MUST come from the same account snapshot as the verified password. */
  async issue(accountId: string, expectedVersion: number): Promise<IssuedSession | null> {
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) return null;
    const now = timestamp(this.clock());
    const token = hex(crypto.getRandomValues(new Uint8Array(32)));
    const id = crypto.randomUUID();
    const result = await this.repository.issue(id, accountId, await hashSessionToken(token), expectedVersion, now);
    return result ? { id, token, expiresAt: result.expiresAt } : null;
  }

  async resolve(token: string) {
    if (!tokenPattern.test(token)) return null;
    const now = timestamp(this.clock());
    const session = await this.repository.resolve(await hashSessionToken(token));
    if (!session || now < session.createdAt || now < session.lastSeenAt) return null;
    if (session.revokedAt !== null || session.active !== 1 || session.accountVersion !== session.currentVersion) return null;
    if (now >= session.expiresAt || now >= session.lastSeenAt + IDLE_TIMEOUT_MS
      || (session.mustChangePassword === 1 && session.restricted !== 1)) {
      await this.repository.revoke(session.id, now);
      return null;
    }
    return session;
  }

  touch(id: string) { return this.repository.touch(id, timestamp(this.clock())); }
  revoke(id: string) { return this.repository.revoke(id, timestamp(this.clock())); }
  invalidateAccount(accountId: string) { return this.repository.invalidateAccount(accountId); }
}

/** Reject duplicate cookies, noncanonical encoding and alternative token transports. */
export function readSessionCookie(request: Request): string | null {
  const values = (request.headers.get("Cookie") ?? "").split(";")
    .map((part) => part.trim()).filter((part) => part.split("=", 1)[0] === SESSION_COOKIE);
  if (values.length !== 1) return null;
  const token = values[0].slice(SESSION_COOKIE.length + 1);
  return tokenPattern.test(token) ? token : null;
}

export async function hashSessionToken(token: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
}

/** Domain-separated HMAC derives a per-session CSRF value without retaining a second secret. */
export async function csrfToken(token: string): Promise<string> {
  return hex(new Uint8Array(await crypto.subtle.sign("HMAC", await csrfKey(token), csrfMessage)));
}

export async function verifyCsrfToken(token: string, submitted: string): Promise<boolean> {
  if (!tokenPattern.test(submitted)) return false;
  const bytes = Uint8Array.from(submitted.match(/../g)!, (byte) => parseInt(byte, 16));
  return crypto.subtle.verify("HMAC", await csrfKey(token), bytes, csrfMessage);
}

async function csrfKey(token: string) {
  if (!tokenPattern.test(token)) throw new Error("Invalid session material");
  return crypto.subtle.importKey("raw", new TextEncoder().encode(token),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export function sessionCookie(session: IssuedSession, now = Date.now()): string {
  if (!tokenPattern.test(session.token)) throw new Error("Invalid session material");
  const lifetime = Math.min(NORMAL_LIFETIME_MS, Math.max(0, session.expiresAt - timestamp(now)));
  return `${SESSION_COOKIE}=${session.token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(lifetime / 1000)}; Expires=${new Date(now + lifetime).toUTCString()}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timestamp(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > 8_640_000_000_000_000 - NORMAL_LIFETIME_MS) {
    throw new Error("Invalid session time");
  }
  return value;
}
