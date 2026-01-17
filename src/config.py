import os

class Settings:
    @property
    def TARGET_BUILDER(self) -> str:
        # Dynamic check
        try:
            # We avoid top level import loop/init cost by doing it here or raw
            # Ideally we use the storage class but let's be raw for config speed/safety
            # OR better: The Service passes the builder to logic, so logic doesn't read settings directly?
            # Existing code: endpoints default target_builder=settings.TARGET_BUILDER.
            # So endpoints call this.
            
            # Helper to read from same DB path as DATABASE_URL
            import sqlite3
            db_url = self.DATABASE_URL
            path = db_url.replace("sqlite:///", "")
            conn = sqlite3.connect(path)
            c = conn.cursor()
            # We need to catch if table doesn't exist yet (bootstrapping)
            try:
                c.execute('SELECT value FROM app_settings WHERE key = ?', ("TARGET_BUILDER",))
                row = c.fetchone()
                if row:
                    return row[0]
            except sqlite3.OperationalError:
                # Table missing likely
                pass
            finally:
                conn.close()
        except:
            pass
            
        return os.getenv("TARGET_BUILDER", "")

    @property
    def STORAGE_TYPE(self) -> str:
        return os.getenv("STORAGE_TYPE", "sqlite") # memory, sqlite, postgres

    @property
    def DATABASE_URL(self) -> str:
        return os.getenv("DATABASE_URL", "sqlite:///hyperliquid.db")

settings = Settings()
