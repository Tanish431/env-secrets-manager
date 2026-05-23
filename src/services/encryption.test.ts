import { encrypt, decrypt, buildAAD } from "./encryption";

// Set key inline for the test
process.env.MASTER_ENCRYPTION_KEY = require("crypto")
  .randomBytes(32)
  .toString("base64");

const aad = buildAAD("DB_PASSWORD", "production");
const payload = encrypt("supersecret", aad);

console.log("Encrypted payload:", payload);

const plaintext = decrypt(payload, aad);
console.log("Decrypted:", plaintext); // → supersecret

// Should throw — wrong AAD (simulates ciphertext swap attack)
try {
  decrypt(payload, buildAAD("DB_PASSWORD", "development"));
  console.error("FAIL: should have thrown");
} catch (e) {
  console.log("Correctly rejected wrong AAD:", (e as Error).message);
}

// Should throw — tampered ciphertext
try {
  decrypt({ ...payload, encryptedValue: "aGVsbG8=" }, aad);
  console.error("FAIL: should have thrown");
} catch (e) {
  console.log("Correctly rejected tampered ciphertext:", (e as Error).message);
}