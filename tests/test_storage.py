import unittest
import os
from src.storage.sqlite import SqliteStorage

class TestStorage(unittest.TestCase):
    def setUp(self):
        self.file_name = "test_storage.db"
        if os.path.exists(self.file_name):
            os.remove(self.file_name)
            
        self.test_db = f"sqlite:///{self.file_name}"
        self.storage = SqliteStorage(self.test_db)

    def tearDown(self):
        if os.path.exists(self.file_name):
            os.remove(self.file_name)

    def test_save_and_retrieve(self):
        fills = [
            {"coin": "BTC", "time": 1000, "px": "50000", "sz": "1.0", "closedPnl": "100.0", "user": "0xA"},
            {"coin": "ETH", "time": 2000, "px": "3000", "sz": "10.0", "closedPnl": "-50.0", "user": "0xA"}
        ]
        
        self.storage.save_fills("0xA", fills)
        
        retrieved = self.storage.get_all_fills("0xA")
        self.assertEqual(len(retrieved), 2)
        self.assertEqual(retrieved[0]["coin"], "BTC")
        self.assertEqual(retrieved[1]["coin"], "ETH")
        
        # Test Latest Timestamp
        latest = self.storage.get_latest_timestamp("0xA")
        self.assertEqual(latest, 2000)

    def test_leaderboard_aggregation(self):
        # User A: +50 PnL
        userA_fills = [
            {"coin": "BTC", "time": 1000, "closedPnl": "100.0", "user": "0xA", "sz": "1.0"},
            {"coin": "BTC", "time": 2000, "closedPnl": "-50.0", "user": "0xA", "sz": "1.0"}
        ]
        # User B: +500 PnL
        userB_fills = [
             {"coin": "SOL", "time": 3000, "closedPnl": "500.0", "user": "0xB", "sz": "100.0"}
        ]
        
        self.storage.save_fills("0xA", userA_fills)
        self.storage.save_fills("0xB", userB_fills)
        
        stats = self.storage.get_leaderboard_stats()
        # Expect B first (500), then A (50)
        self.assertEqual(len(stats), 2)
        self.assertEqual(stats[0]["user"], "0xB")
        self.assertEqual(stats[0]["metricValue"], 500.0)
        self.assertEqual(stats[1]["user"], "0xA")
        self.assertEqual(stats[1]["metricValue"], 50.0)

if __name__ == '__main__':
    unittest.main()
