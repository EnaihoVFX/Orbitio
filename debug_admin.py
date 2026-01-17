import os
from dotenv import load_dotenv
load_dotenv()

from src.storage.sqlite import SqliteStorage
from src.config import settings

try:
    print(f"Using database: {settings.DATABASE_URL}")
    storage = SqliteStorage(settings.DATABASE_URL)
    
    # Simulate get_stats logic locally
    import sqlite3
    conn = sqlite3.connect(storage.file_path)
    c = conn.cursor()
    c.execute("SELECT COUNT(*), AVG(latency_ms) FROM request_logs")
    row = c.fetchone()
    conn.close()
    
    print(f"Row: {row}")
    
    chart_data = storage.get_request_timeseries("24h")
    print(f"Chart Data: {chart_data}")
    
except Exception as e:
    import traceback
    traceback.print_exc()
