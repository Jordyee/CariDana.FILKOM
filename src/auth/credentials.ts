import {
  createPasswordVerifier,
  createRandomCredential,
  secureRandomBytes,
  type PasswordPolicy,
  type PasswordVerifier,
  type RandomBytes,
} from "./password";

/**
 * Internal, single-display provisioning material. It must never be serialized
 * into an HTTP DTO, log record, snapshot, or durable plaintext store.
 */
export interface IssuedTemporaryCredential {
  credential: string;
  verifier: PasswordVerifier;
  oneTime: true;
  mustChangePassword: true;
}

export async function issueTemporaryCredential(
  policy: PasswordPolicy,
  randomBytes: RandomBytes = secureRandomBytes,
): Promise<IssuedTemporaryCredential> {
  const credential = createRandomCredential(randomBytes);
  const verifier = await createPasswordVerifier(credential, policy, randomBytes);

  return { credential, verifier, oneTime: true, mustChangePassword: true };
}
