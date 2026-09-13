export const PBKDF2_HMAC_SHA_256 = "PBKDF2-HMAC-SHA-256" as const;

export interface PasswordParameters {
  algorithm: typeof PBKDF2_HMAC_SHA_256;
  iterations: number;
  derivedKeyLength: number;
}

/**
 * A caller supplies the currently selected policy. T008 intentionally does not
 * choose a deployed production cost; T012 owns that Worker CPU decision.
 */
export interface PasswordPolicy {
  version: number;
  parameters: PasswordParameters;
}

/** Internal persistence material, never a response DTO. */
export interface PasswordVerifier {
  hash: Uint8Array;
  salt: Uint8Array;
  version: number;
  parameters: PasswordParameters;
}

export interface StoredPasswordVerifier {
  hash: Uint8Array | number[];
  salt: Uint8Array | number[];
  version: number;
  parameters: PasswordParameters | string;
}

/** The password-only subset of the internal T003 account row. */
export interface AccountPasswordFields {
  password_hash: Uint8Array | number[];
  password_salt: Uint8Array | number[];
  password_version: number;
  password_parameters: PasswordParameters | string;
}

export type RandomBytes = (length: number) => Uint8Array;
export type PasswordDeriver = (
  credential: string,
  salt: Uint8Array,
  parameters: PasswordParameters,
) => Promise<Uint8Array>;

export interface PasswordVerification {
  valid: boolean;
  needsUpgrade: boolean;
}

const SALT_BYTES = 16;
const TEMPORARY_CREDENTIAL_BYTES = 32;

export function secureRandomBytes(length: number): Uint8Array {
  if (!Number.isSafeInteger(length) || length <= 0) {
    throw new TypeError("Random byte length must be a positive integer");
  }
  return crypto.getRandomValues(new Uint8Array(length));
}

export function createRandomCredential(randomBytes: RandomBytes = secureRandomBytes): string {
  return base64Url(assertRandomBytes(randomBytes(TEMPORARY_CREDENTIAL_BYTES), TEMPORARY_CREDENTIAL_BYTES));
}

export async function createPasswordVerifier(
  credential: string,
  policy: PasswordPolicy,
  randomBytes: RandomBytes = secureRandomBytes,
): Promise<PasswordVerifier> {
  assertCredential(credential);
  const normalizedPolicy = normalizePolicy(policy);
  const salt = assertRandomBytes(randomBytes(SALT_BYTES), SALT_BYTES);
  const hash = await derivePasswordHash(credential, salt, normalizedPolicy.parameters);

  return {
    hash,
    salt,
    version: normalizedPolicy.version,
    parameters: normalizedPolicy.parameters,
  };
}

/**
 * Creates verifier-only material for the nonexistent-account path. The random
 * input is discarded immediately, so the dummy cannot authenticate an account.
 */
export async function createDummyPasswordVerifier(
  policy: PasswordPolicy,
  randomBytes: RandomBytes = secureRandomBytes,
): Promise<PasswordVerifier> {
  const discardedInput = createRandomCredential(randomBytes);
  return createPasswordVerifier(discardedInput, policy, randomBytes);
}

/**
 * Performs exactly one PBKDF2 derivation and one byte comparison regardless of
 * whether stored material was supplied. A malformed verifier uses the dummy
 * path and is never considered valid.
 */
export async function verifyPassword(
  credential: string,
  storedVerifier: StoredPasswordVerifier | PasswordVerifier | null,
  dummyVerifier: StoredPasswordVerifier | PasswordVerifier,
  currentPolicy: PasswordPolicy,
  derive: PasswordDeriver = derivePasswordHash,
): Promise<PasswordVerification> {
  assertCredential(credential);
  const normalizedDummy = parsePasswordVerifier(dummyVerifier);
  const normalizedCurrentPolicy = normalizePolicy(currentPolicy);
  const normalizedStored = tryParsePasswordVerifier(storedVerifier);
  const candidate = normalizedStored ?? normalizedDummy;
  const derived = await derive(credential, candidate.salt, candidate.parameters);
  const matches = timingSafeEqual(derived, candidate.hash);
  const valid = normalizedStored !== null && matches;

  return {
    valid,
    needsUpgrade: valid && !samePolicy(normalizedStored, normalizedCurrentPolicy),
  };
}

export function parsePasswordVerifier(
  input: StoredPasswordVerifier | PasswordVerifier,
): PasswordVerifier {
  if (!isRecord(input)) throw new TypeError("Password verifier must be an object");

  const parameters = parseParameters(input.parameters);
  const version = parsePositiveInteger(input.version, "Password verifier version");
  const salt = toBytes(input.salt, "Password salt");
  const hash = toBytes(input.hash, "Password hash");

  if (salt.length < SALT_BYTES) throw new TypeError("Password salt is too short");
  if (hash.length !== parameters.derivedKeyLength) {
    throw new TypeError("Password hash has an unexpected length");
  }

  return { hash, salt, version, parameters };
}

/** Converts internal D1 field names without ever creating a response DTO. */
export function parseAccountPasswordVerifier(input: AccountPasswordFields): PasswordVerifier {
  return parsePasswordVerifier({
    hash: input.password_hash,
    salt: input.password_salt,
    version: input.password_version,
    parameters: input.password_parameters,
  });
}

export async function derivePasswordHash(
  credential: string,
  salt: Uint8Array,
  parameters: PasswordParameters,
): Promise<Uint8Array> {
  assertCredential(credential);
  const normalizedParameters = parseParameters(parameters);
  const normalizedSalt = toBytes(salt, "Password salt");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(credential),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: normalizedSalt,
      iterations: normalizedParameters.iterations,
      hash: "SHA-256",
    },
    key,
    normalizedParameters.derivedKeyLength * 8,
  );
  return new Uint8Array(bits);
}

function tryParsePasswordVerifier(
  input: StoredPasswordVerifier | PasswordVerifier | null,
): PasswordVerifier | null {
  try {
    return input === null ? null : parsePasswordVerifier(input);
  } catch {
    return null;
  }
}

function normalizePolicy(policy: PasswordPolicy): PasswordPolicy {
  if (!isRecord(policy)) throw new TypeError("Password policy must be an object");
  return {
    version: parsePositiveInteger(policy.version, "Password policy version"),
    parameters: parseParameters(policy.parameters),
  };
}

function parseParameters(input: unknown): PasswordParameters {
  const value = typeof input === "string" ? parseJsonObject(input) : input;
  if (!isRecord(value) || value.algorithm !== PBKDF2_HMAC_SHA_256) {
    throw new TypeError("Only PBKDF2-HMAC-SHA-256 password parameters are supported");
  }

  const iterations = parsePositiveInteger(value.iterations, "PBKDF2 iterations");
  const derivedKeyLength = parsePositiveInteger(value.derivedKeyLength, "PBKDF2 derived key length");
  if (derivedKeyLength < 16 || derivedKeyLength > 64) {
    throw new TypeError("PBKDF2 derived key length is outside the supported range");
  }

  return { algorithm: PBKDF2_HMAC_SHA_256, iterations, derivedKeyLength };
}

function parseJsonObject(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new TypeError("Password parameters must be valid JSON");
  }
}

function parsePositiveInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) <= 0 || (value as number) > 2_147_483_647) {
    throw new TypeError(`${label} must be a positive safe integer`);
  }
  return value as number;
}

function toBytes(value: Uint8Array | number[], label: string): Uint8Array {
  if (value instanceof Uint8Array) return new Uint8Array(value);
  if (!Array.isArray(value) || !value.every((entry) => Number.isInteger(entry) && entry >= 0 && entry <= 255)) {
    throw new TypeError(`${label} must contain bytes`);
  }
  return Uint8Array.from(value);
}

function assertRandomBytes(value: Uint8Array, length: number): Uint8Array {
  if (!(value instanceof Uint8Array) || value.length !== length) {
    throw new TypeError("Random byte source returned an invalid result");
  }
  return new Uint8Array(value);
}

function assertCredential(credential: string): void {
  if (typeof credential !== "string" || credential.length === 0) {
    throw new TypeError("Credential must be a nonempty string");
  }
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

function samePolicy(verifier: PasswordVerifier, policy: PasswordPolicy): boolean {
  return verifier.version === policy.version
    && verifier.parameters.algorithm === policy.parameters.algorithm
    && verifier.parameters.iterations === policy.parameters.iterations
    && verifier.parameters.derivedKeyLength === policy.parameters.derivedKeyLength;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
