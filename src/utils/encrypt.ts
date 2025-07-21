// AES-GCM encryption utilities for browser (Web Crypto API)
// Usage: encryptData(faceData, key) -> { iv, ciphertext }
//        decryptData({ iv, ciphertext }, key) -> faceData

export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: any, key: CryptoKey): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  return { iv, ciphertext };
}

export async function decryptData(
  encrypted: { iv: Uint8Array; ciphertext: ArrayBuffer },
  key: CryptoKey
): Promise<any> {
  const decoded = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: encrypted.iv },
    key,
    encrypted.ciphertext
  );
  const json = new TextDecoder().decode(decoded);
  return JSON.parse(json);
}
