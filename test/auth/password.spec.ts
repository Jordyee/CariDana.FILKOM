import { describe, expect, it } from "vitest";
import {
  createDummyPasswordVerifier,
  createPasswordVerifier,
  parseAccountPasswordVerifier,
  parsePasswordVerifier,
  verifyPassword,
  type PasswordDeriver,
  type PasswordPolicy,
} from "../../src/auth/password";
import { issueTemporaryCredential } from "../../src/auth/credentials";
import { REDACTED_AUTH_VALUE, redactCredentialLogValue } from "../../src/logging/redaction";

const policyV1: PasswordPolicy = {
  version: 1,
  parameters: { algorithm: "PBKDF2-HMAC-SHA-256", iterations: 1_000, derivedKeyLength: 32 },
};

const policyV2: PasswordPolicy = {
  version: 2,
  parameters: { algorithm: "PBKDF2-HMAC-SHA-256", iterations: 1_200, derivedKeyLength: 32 },
};

const syntheticInput = ["synthetic", "auth", "input"].join("-");

function deterministicBytes() {
  let next = 1;
  return (length: number) => Uint8Array.from({ length }, () => next++ & 0xff);
}

describe("versioned password primitives", () => {
  it("creates and verifies a salted PBKDF2 verifier without exposing the input", async () => {
    const verifier = await createPasswordVerifier(syntheticInput, policyV1, deterministicBytes());
    const dummyVerifier = await createDummyPasswordVerifier(policyV1, deterministicBytes());

    expect(verifier.salt).toHaveLength(16);
    expect(verifier.hash).toHaveLength(policyV1.parameters.derivedKeyLength);
    expect(verifier.version).toBe(policyV1.version);

    const storedVerifier = parseAccountPasswordVerifier({
      password_hash: Array.from(verifier.hash),
      password_salt: Array.from(verifier.salt),
      password_version: verifier.version,
      password_parameters: JSON.stringify(verifier.parameters),
    });

    await expect(verifyPassword(syntheticInput, storedVerifier, dummyVerifier, policyV1))
      .resolves.toEqual({ valid: true, needsUpgrade: false });
  });

  it("uses one derivation for valid, invalid, and nonexistent-account checks", async () => {
    const verifier = await createPasswordVerifier(syntheticInput, policyV1, deterministicBytes());
    const dummyVerifier = await createDummyPasswordVerifier(policyV1, deterministicBytes());
    const derive: PasswordDeriver = async (...args) => {
      derivations += 1;
      return await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: args[1], iterations: args[2].iterations, hash: "SHA-256" },
        await crypto.subtle.importKey("raw", new TextEncoder().encode(args[0]), "PBKDF2", false, ["deriveBits"]),
        args[2].derivedKeyLength * 8,
      ).then((bits) => new Uint8Array(bits));
    };
    let derivations = 0;

    await expect(verifyPassword(syntheticInput, verifier, dummyVerifier, policyV1, derive))
      .resolves.toMatchObject({ valid: true });
    expect(derivations).toBe(1);

    derivations = 0;
    await expect(verifyPassword("synthetic-wrong-input", verifier, dummyVerifier, policyV1, derive))
      .resolves.toEqual({ valid: false, needsUpgrade: false });
    expect(derivations).toBe(1);

    derivations = 0;
    await expect(verifyPassword("synthetic-wrong-input", null, dummyVerifier, policyV1, derive))
      .resolves.toEqual({ valid: false, needsUpgrade: false });
    expect(derivations).toBe(1);
  });

  it("signals a successful verifier upgrade and rejects raw SHA-256 metadata", async () => {
    const verifier = await createPasswordVerifier(syntheticInput, policyV1, deterministicBytes());
    const dummyVerifier = await createDummyPasswordVerifier(policyV2, deterministicBytes());

    await expect(verifyPassword(syntheticInput, verifier, dummyVerifier, policyV2))
      .resolves.toEqual({ valid: true, needsUpgrade: true });

    expect(() => parsePasswordVerifier({
      ...verifier,
      parameters: { ...verifier.parameters, algorithm: "SHA-256" } as unknown as typeof verifier.parameters,
    })).toThrow(/PBKDF2/i);
  });

  it("issues a random one-time credential with a forced-replacement marker", async () => {
    let randomCalls = 0;
    const countedRandomBytes = (length: number) => {
      randomCalls += 1;
      return Uint8Array.from({ length }, (_, index) => index + 1);
    };
    const first = await issueTemporaryCredential(policyV1, countedRandomBytes);
    const dummyVerifier = await createDummyPasswordVerifier(policyV1, deterministicBytes());

    expect(first.oneTime).toBe(true);
    expect(first.mustChangePassword).toBe(true);
    expect(first.verifier.version).toBe(policyV1.version);
    expect(randomCalls).toBe(2);
    await expect(verifyPassword(first.credential, first.verifier, dummyVerifier, policyV1))
      .resolves.toEqual({ valid: true, needsUpgrade: false });
  });

  it("redacts credential material before a log boundary", () => {
    const rawPasswordField = ["pass", "word"].join("");
    const redacted = redactCredentialLogValue({
      event: "synthetic-auth-event",
      [rawPasswordField]: ["synthetic", "value", "not", "logged"].join("-"),
      nested: { password_salt: [1, 2, 3], verifier: { hash: [4, 5, 6] } },
      hash: [7, 8, 9],
    });

    expect(redacted).toEqual({
      event: "synthetic-auth-event",
      [rawPasswordField]: REDACTED_AUTH_VALUE,
      nested: { password_salt: REDACTED_AUTH_VALUE, verifier: REDACTED_AUTH_VALUE },
      hash: REDACTED_AUTH_VALUE,
    });
  });
});
