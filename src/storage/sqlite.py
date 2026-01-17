import sqlite3
import json
from typing import List, Any, Optional
from .base import StorageBackend

class SqliteStorage(StorageBackend):
    def __init__(self, db_path: str):
        # db_path is expected to be like "sqlite:///hyperliquid.db" 
        # extract path part
        if db_path.startswith("sqlite:///"):
            self.file_path = db_path.replace("sqlite:///", "")
        else:
            self.file_path = db_path
            
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.file_path)
        c = conn.cursor()
        # Create Fills Table
        # Store bare minimum raw data + indexed columns for queries
        c.execute('''
            CREATE TABLE IF NOT EXISTS fills (
                id TEXT PRIMARY KEY, 
                user TEXT,
                coin TEXT,
                time INTEGER,
                closedPnl TEXT,
                fee TEXT,
                builder TEXT,
                raw_json TEXT
            )
        ''')
        c.execute('CREATE INDEX IF NOT EXISTS idx_user_time ON fills (user, time)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_user_coin ON fills (user, coin)')

        # New SaaS Tables
        # api_keys is managed by SQLAlchemy in database.py
        # c.execute('''
        #     CREATE TABLE IF NOT EXISTS api_keys (
        #         key TEXT PRIMARY KEY,
        #         name TEXT,
        #         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        #         is_active BOOLEAN DEFAULT 1
        #     )
        # ''')

        # request_logs is now managed by SQLAlchemy in database.py
        # c.execute('''
        #     CREATE TABLE IF NOT EXISTS request_logs (
        #         id INTEGER PRIMARY KEY AUTOINCREMENT,
        #         timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        #         endpoint TEXT,
        #         status_code INTEGER,
        #         latency_ms REAL,
        #         api_key TEXT,
        #         user_addr TEXT
        #     )
        # ''')
        # c.execute('CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON request_logs (timestamp)')

        c.execute('''
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        ''')

        conn.commit()
        conn.close()

    # --- SaaS Methods ---

    def create_api_key(self, key: str, name: str):
        conn = sqlite3.connect(self.file_path)
        c = conn.cursor()
        c.execute('INSERT INTO api_keys (key, name) VALUES (?, ?)', (key, name))
        conn.commit()
        conn.close()

    def get_api_key(self, key: str) -> Optional[dict]:
        conn = sqlite3.connect(self.file_path)
        c = conn.cursor()
        c.execute('SELECT key, name, is_active FROM api_keys WHERE key = ?', (key,))
        row = c.fetchone()
        conn.close()
        if row:
            return {"key": row[0], "name": row[1], "is_active": bool(row[2])}
        return None
    
    def log_request(self, endpoint: str, status_code: int, latency_ms: float, api_key: str = None, user_addr: str = None):
        # Fire and forget logging (blocking for sqlite but fast enough)
        conn = sqlite3.connect(self.file_path)
        c = conn.cursor()
        c.execute('''
            INSERT INTO request_logs (endpoint, status_code, latency_ms, api_key, user_addr)
            VALUES (?, ?, ?, ?, ?)
        ''', (endpoint, status_code, latency_ms, api_key, user_addr))
        conn.commit()
        conn.close()

    def get_setting(self, key: str) -> Optional[str]:
        conn = sqlite3.connect(self.file_path)
        c = conn.cursor()
        c.execute('SELECT value FROM app_settings WHERE key = ?', (key,))
        row = c.fetchone()
        conn.close()
        return row[0] if row else None

    def set_setting(self, key: str, value: str):
        conn = sqlite3.connect(self.file_path)
        c = conn.cursor()
        c.execute('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', (key, value))
        conn.commit()
        conn.close()

    def get_latest_timestamp(self, user: str, coin: str = None) -> Optional[int]:
        conn = sqlite3.connect(self.file_path)
        c = conn.cursor()
        if coin:
            c.execute('SELECT MAX(time) FROM fills WHERE user = ? AND coin = ?', (user, coin))
        else:
            c.execute('SELECT MAX(time) FROM fills WHERE user = ?', (user,))
        row = c.fetchone()
        conn.close()
        return row[0] if row and row[0] else 0

    def save_fills(self, user: str, fills: List[Any]):
        conn = sqlite3.connect(self.file_path)
        c = conn.cursor()
        
        data_to_insert = []
        for fill in fills:
            tid = fill.get('tid') or fill.get('oid') or f"{fill['time']}_{fill['coin']}_{fill['sz']}"
            row_id = f"{user}_{tid}"
            
            # Extract analytics columns
            closed_pnl = str(fill.get('closedPnl', '0.0'))
            fee = str(fill.get('fee', '0.0'))
            builder = fill.get('builder') or (fill.get('builderInfo') or {}).get('builder')
            
            data_to_insert.append((
                row_id,
                user,
                fill.get('coin'),
                fill['time'],
                closed_pnl,
                fee,
                builder,
                json.dumps(fill)
            ))
            
        c.executemany('''
            INSERT OR IGNORE INTO fills (id, user, coin, time, closedPnl, fee, builder, raw_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', data_to_insert)
        
        conn.commit()
        conn.close()

    def get_all_fills(self, user: str) -> List[Any]:
        conn = sqlite3.connect(self.file_path)
        c = conn.cursor()
        c.execute('SELECT raw_json FROM fills WHERE user = ? ORDER BY time ASC', (user,))
        rows = c.fetchall()
        conn.close()
        return [json.loads(r[0]) for r in rows]

    def get_leaderboard_stats(self, metric: str = "pnl") -> List[Any]:
        # Return composite stats for basic leaderboard stub
        # We aggregate by user.
        # SQLite doesn't have Decimal type, so SUM() on text fields might be wonky without casting.
        # However, for PnL ranking, simple float sum logic in SQL might be "good enough" for sorting?
        # Or we fetch all users and sum in python? Fetching all is safer for exactness but slower.
        # Let's try SQL sum.
        
        conn = sqlite3.connect(self.file_path)
        c = conn.cursor()
        
        # We need to sum fees and pnl.
        # SQLite CAST(col as REAL) works for basic sorting.
        # NOTE: This ignores the sophisticated "Taint" logic for exclusion.
        # The Taint logic runs at Query-time (assembling lifecycles).
        # We cannot easily replicate "Lifecycle Taint" in pure SQLite Query without complex window functions.
        # Strategy: Fetch aggregated basics here, but for "Pure Builder Mode" accuracy,
        # we might need to load trades and re-run logic.
        # FOR NOW: Simple aggregation.
        
        query = '''
            SELECT 
                user, 
                SUM(CAST(closedPnl AS REAL)) as total_pnl, 
                COUNT(*) as trade_count 
            FROM fills 
            GROUP BY user 
            ORDER BY total_pnl DESC 
            LIMIT 50
        '''
        c.execute(query)
        rows = c.fetchall()
        conn.close()
        
        # Structure: [{'user': ..., 'pnl': ..., 'count': ...}]
        results = []
        for r in rows:
            results.append({
                "user": r[0],
                "metricValue": r[1],
                "tradeCount": r[2]
            })
        return results
    
    def get_request_timeseries(self, duration: str = "24h") -> List[Any]:
        conn = sqlite3.connect(self.file_path)
        c = conn.cursor()
        
        # Format string for SQLite strftime
        # %Y-%m-%d %H:%M:%S
        
        group_format = "%Y-%m-%d %H:00:00" # Default hourly
        delta = "-1 day"
        
        if duration == "1h":
            group_format = "%Y-%m-%d %H:%M:00"
            delta = "-1 hour"
        elif duration == "24h":
            group_format = "%Y-%m-%d %H:00:00"
            delta = "-1 day"
        elif duration == "7d":
            group_format = "%Y-%m-%d"
            delta = "-7 days"
        elif duration == "30d":
            group_format = "%Y-%m-%d"
            delta = "-30 days"
            
        query = f'''
            SELECT strftime('{group_format}', created_at) as bucket, COUNT(*) 
            FROM request_logs 
            WHERE created_at >= datetime('now', '{delta}')
            GROUP BY bucket 
            ORDER BY bucket ASC
        '''
        
        c.execute(query)
        rows = c.fetchall()
        conn.close()
        
        return [{"name": r[0], "val": r[1]} for r in rows]
