from .user import User

class AuthTokens:
    def __init__(self, access_token: str, refresh_token: str):
        self.access_token = access_token
        self.refresh_token = refresh_token


class AuthService:
    def __init__(self, token_generator, password_hasher, user_repo):
        self.token_generator = token_generator
        self.password_hasher = password_hasher
        self.user_repo = user_repo


    def register(self, email: str, password: str, full_name: str) -> User:
        hashed = self.password_hasher(password)
        user = User(id=None, email=email, full_name=full_name, password_hash=hashed)
        return self.user_repo.create_user(user) # crud


    def login(self, email: str, password: str) -> AuthTokens:
        user = self.user_repo.get_user_by_email(email) # crud
        if not user or not user.check_password(password, self.password_hasher.verify): # èohitho
            raise ValueError("Sai email hoặc mật khẩu.")
        return self.token_generator.generate(user.id)