"""AES-256-GCM token decryption — matches auth-service encryption."""
from __future__ import annotations
import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from src.config import settings


def _key() -> bytes:
    raw = settings.token_encryption_key
    if not raw:
        raise RuntimeError("TOKEN_ENCRYPTION_KEY not set")
    return bytes.fromhex(raw)


def decrypt_token(encrypted_b64: str, iv_b64: str, tag_b64: str) -> str:
    key = _key()
    iv = base64.b64decode(iv_b64)
    tag = base64.b64decode(tag_b64)
    ciphertext = base64.b64decode(encrypted_b64)

    aesgcm = AESGCM(key)
    # GCM tag is appended to ciphertext in cryptography library
    plaintext = aesgcm.decrypt(iv, ciphertext + tag, None)
    return plaintext.decode()
