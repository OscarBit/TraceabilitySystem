import hmac
import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_dev_key_change_in_prod")

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
