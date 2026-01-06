const crypto = require("crypto");

const BLOCK_CIPHER = "aes-256-gcm";
const AUTH_TAG_BYTE_LEN = 16;
const IV_BYTE_LEN = 12;

const getIV = () => crypto.randomBytes(IV_BYTE_LEN);

const getKey = (key) => crypto.createHash("sha256").update(key).digest();

function encrypt(msg, key) {
  const iv = getIV();
  const cipher = crypto.createCipheriv(BLOCK_CIPHER, getKey(key), iv, {
    authTagLength: AUTH_TAG_BYTE_LEN,
  });
  let encryptedMessage = cipher.update(msg);
  encryptedMessage = Buffer.concat([encryptedMessage, cipher.final()]);
  return Buffer.concat([iv, encryptedMessage, cipher.getAuthTag()]);
}

function decrypt(ciphertext, key) {
  const authTag = ciphertext.slice(-AUTH_TAG_BYTE_LEN);
  const iv = ciphertext.slice(0, IV_BYTE_LEN);
  const encryptedMessage = ciphertext.slice(IV_BYTE_LEN, -AUTH_TAG_BYTE_LEN);
  const decipher = crypto.createDecipheriv(BLOCK_CIPHER, getKey(key), iv, {
    authTagLength: AUTH_TAG_BYTE_LEN,
  });
  decipher.setAuthTag(authTag);
  let msg = decipher.update(encryptedMessage);
  msg = Buffer.concat([msg, decipher.final()]);
  return msg;
}

exports.encrypt = encrypt;
exports.decrypt = decrypt;
