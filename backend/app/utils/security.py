import hmac
import hashlib
import os
import secrets
import warnings
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    # No committed fallback: a shared default would let anyone forge QR tokens.
    # Development gets a throwaway key; docker-compose refuses to start without
    # a real one. Note that QR tokens minted under a throwaway key stop
    # verifying when the process restarts.
    SECRET_KEY = secrets.token_hex(32)
    warnings.warn(
        "SECRET_KEY is not set. Using a random key for this process only; "
        "QR tokens will not verify after a restart.",
        RuntimeWarning,
    )

def generate_qr_token(identifier: str) -> str:
    """
    Generates a secure HMAC-SHA256 token for a given identifier (lote or piedra ID).
    """
    message = identifier.encode('utf-8')
    secret = SECRET_KEY.encode('utf-8')
    token = hmac.new(secret, message, hashlib.sha256).hexdigest()
    return token

def verify_qr_token(identifier: str, token: str) -> bool:
    """
    Verifies if a given token matches the secure HMAC-SHA256 token for the identifier.
    """
    expected_token = generate_qr_token(identifier)
    return hmac.compare_digest(expected_token, token)
