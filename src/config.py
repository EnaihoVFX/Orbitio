import os

class Settings:
    @property
    def TARGET_BUILDER(self) -> str:
        return os.getenv("TARGET_BUILDER", "")

    @property
    def STORAGE_TYPE(self) -> str:
        return os.getenv("STORAGE_TYPE", "sqlite") # memory, sqlite, postgres

    @property
    def DATABASE_URL(self) -> str:
        return os.getenv("DATABASE_URL", "sqlite:///hyperliquid.db")

settings = Settings()
