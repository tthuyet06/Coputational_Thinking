from dataclasses import dataclass

@dataclass(frozen=True)
class AuthTokens:
    access_token: str
    refresh_token: str
