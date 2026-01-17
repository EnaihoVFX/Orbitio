import unittest
from typing import List, Any
from src.services import LedgerService
from src.datasources.base import DataSource

class MockBuilderDataSource(DataSource):
    def get_user_fills(self, address: str) -> List[Any]:
        return [
            # Lifecycle 1: Pure Builder A
            # Open Long 1
            {"coin": "BTC", "side": "B", "sz": "1.0", "px": "50000.0", "time": 1000, "fee": "10.0", "builder": "0xBuilderA"},
            # Close Long 1
            {"coin": "BTC", "side": "A", "sz": "1.0", "px": "55000.0", "time": 2000, "fee": "5.0", "builder": "0xBuilderA"},
            
            # Lifecycle 2: Mixed (Tainted)
            # Open Long 1 (Builder A)
            {"coin": "ETH", "side": "B", "sz": "10.0", "px": "3000.0", "time": 3000, "fee": "10.0", "builder": "0xBuilderA"},
            # Partial Close (No Builder / Other Builder)
            {"coin": "ETH", "side": "A", "sz": "5.0", "px": "3100.0", "time": 4000, "fee": "5.0", "builder": "0xOther"},
            # Close Remaining (Builder A)
            {"coin": "ETH", "side": "A", "sz": "5.0", "px": "3200.0", "time": 5000, "fee": "5.0", "builder": "0xBuilderA"},
            
            # Lifecycle 3: Pure Builder B (Should be excluded if filter=A)
            {"coin": "SOL", "side": "B", "sz": "100.0", "px": "100.0", "time": 6000, "fee": "1.0", "builder": "0xBuilderB"},
            {"coin": "SOL", "side": "A", "sz": "100.0", "px": "110.0", "time": 7000, "fee": "1.0", "builder": "0xBuilderB"}
        ]

    def get_user_funding(self, address: str, start_time: int, end_time: int) -> List[Any]:
        return []

    def get_all_mids(self) -> dict: return {}

class TestBuilderLogic(unittest.TestCase):
    def setUp(self):
        self.service = LedgerService(MockBuilderDataSource())

    def test_no_filter(self):
        trades = self.service.get_trades("dummy")
        # Should have all trades (2 + 3 + 2 = 7 trades)
        self.assertEqual(len(trades), 7)

    def test_filter_builder_a(self):
        trades = self.service.get_trades("dummy", target_builder="0xBuilderA", builder_only=True)
        
        # Lifecycle 1 (BTC): Pure Builder A -> Include (2 trades)
        # Lifecycle 2 (ETH): Tainted by 0xOther -> Exclude from PnL aggregates, but return in list?
        # Logic update: "returns only trades attributed... and marks mixed activity as tainted"
        # My implementation: If builderOnly=True, filter trades by builder.
        # So trade (18) 0xOther is removed.
        # But trades 16, 20 are 0xBuilderA. They are tainted. 
        # So we expect BTC(2) + ETH(2). Total 4.
        
        self.assertEqual(len(trades), 4)
        self.assertEqual(trades[0].coin, "BTC")
        self.assertEqual(trades[2].coin, "ETH")
        self.assertTrue(trades[2].tainted)

    def test_filter_builder_b(self):
        trades = self.service.get_trades("dummy", target_builder="0xBuilderB", builder_only=True)
        
        # Only SOL trades should remain
        self.assertEqual(len(trades), 2)
        self.assertEqual(trades[0].coin, "SOL")

    def test_builder_case_insensitivity(self):
        # Target: 0xbuildera (lowercase)
        # Data has: 0xBuilderA (mixed match)
        # Should matched and NOT filter it out.
        trades = self.service.get_trades("dummy", target_builder="0xbuildera", builder_only=True)
        
        # Should include BTC matched trades (2) and tainted ETH trades (2, but marked tainted)
        # Total 4. If case fail, it would be 0 (all filtered).
        self.assertEqual(len(trades), 4)
        self.assertEqual(trades[0].coin, "BTC")
        # Ensure builder is preserved in original case in object? 
        # API usually returns as is, but our logic normalized it for check.
        # The 'trade_obj' uses 'builder_address' which we lowercased?
        # Yes, we updated 'builder_address' variable which is passed to Trade constructor.
        # So returned trade will have lowercase builder.
        self.assertEqual(trades[0].builder, "0xbuildera")

if __name__ == '__main__':
    unittest.main()
