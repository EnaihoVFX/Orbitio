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
