import unittest
from typing import List, Any
from decimal import Decimal
from src.services import LedgerService
from src.datasources.base import DataSource

class MockDataSource(DataSource):
    def get_user_fills(self, address: str) -> List[Any]:
        return [
            # Buy 1 BTC at 50000
            {"coin": "BTC", "side": "B", "sz": "1.0", "px": "50000.0", "time": 1000, "fee": "10.0"},
            # Sell 0.5 BTC at 55000
            {"coin": "BTC", "side": "A", "sz": "0.5", "px": "55000.0", "time": 2000, "fee": "5.0"},
            # Sell 0.5 BTC at 40000
            {"coin": "BTC", "side": "A", "sz": "0.5", "px": "40000.0", "time": 3000, "fee": "5.0"}
        ]

    def get_user_funding(self, address: str, start_time: int, end_time: int) -> List[Any]:
        return []

    def get_all_mids(self) -> dict:
        return {"BTC": 55000.0} # Current price higher than entry (50000)

class TestLedgerService(unittest.TestCase):
    def setUp(self):
        self.service = LedgerService(MockDataSource())

    def test_pnl_calculation(self):
        # trades = self.service.get_trades("dummy_address")
        data = self.service._process_ledger("dummy_address")
        trades = data["trades"]
        pnl_response = data["pnl"]
        
        self.assertEqual(len(trades), 3)
        
        # Trade 1: Open Long 1 BTC @ 50000. Fee 10.
        # Closed PnL: 0
        self.assertEqual(trades[0].closedPnl, Decimal("0.0"))
        
        # Trade 2: Close 0.5 BTC @ 55000. 
        # PnL = (55000 - 50000) * 0.5 = 2500.
        # Fee 5.
        self.assertEqual(trades[1].closedPnl, Decimal("2500.0"))
        
        # Trade 3: Close 0.5 BTC @ 40000.
        # Entry was 50000.
        # PnL = (40000 - 50000) * 0.5 = -5000.
        # Fee 5.
        self.assertEqual(trades[2].closedPnl, Decimal("-5000.0"))
        
        # Total PnL = 2500 - 5000 = -2500. 
        # Spec says realizedPnl is sum of closedPnl.
        self.assertEqual(pnl_response.realizedPnl, Decimal("-2500.0"))
        # Fees Paid = 10 + 5 + 5 = 20
        self.assertEqual(pnl_response.feesPaid, Decimal("20.0"))
        
        # The new PnLResponse is aggregate.
        
    def test_unrealized_pnl(self):
        # Trade 1: Buy 1 BTC @ 50000.
        # Fill list from MockDataSource includes:
        # Buy 1 BTC @ 50000 (Time 1000)
        # Sell 0.5 BTC @ 55000 (Time 2000)
        # Sell 0.5 BTC @ 40000 (Time 3000)
        # Net Size = 0.
        # Wait, the default MockDataSource has Net Size 0?
        # Yes: Buy 1, Sell 0.5, Sell 0.5.
        
        # We need a NEW Mock that leaves position open.
        class OpenPositionMock(DataSource):
            def get_user_fills(self, address: str) -> List[Any]:
                return [
                     {"coin": "BTC", "side": "B", "sz": "1.0", "px": "50000.0", "time": 1000, "fee": "10.0"}
                ]
            def get_user_funding(self, a, s, e): return []
            def get_all_mids(self): return {"BTC": 60000.0}
            
        service = LedgerService(OpenPositionMock())
        data = service._process_ledger("dummy")
        pnl = data["pnl"]
        
        # Open: 1 BTC @ 50000.
        # Current: 60000.
        # uPnL = (60000 - 50000) * 1 = 10000.
        self.assertEqual(pnl.unrealizedPnl, Decimal("10000.0"))
        
        self.assertEqual(pnl.realizedPnl, Decimal("0.0"))

    def test_pnl_history(self):
        # 2 events:
        # Time 1000: Open (No PnL)
        # Time 1500: Tainted Funding (Excluded in Builder Mode)
        # Wait, MockFundingDataSource has tainted funding. 
        # Time 2000: Close (PnL impact)
        
        # In Builder Mode (Builder A):
        # Funding at 1500 is tainted -> Excluded.
        # Trade at 2000 (Closing) is Tainted? 
        # MockFundingDataSource: Close Long 1 BTC @ 51000 ... builder="0xBuilderB".
        # So Lifecycle is Tainted.
        # Trade PnL is excluded from Builder aggregates. Wait.
        # "exclude from builder-only aggregates"
        # My implementation: "marks mixed activity as tainted... exclude from PnL".
        # So the Trade PnL is NOT in the history?
        # Logic check:
        # if builder_only:
        #    if not t.tainted: ...
        
        # Correct, tainted trades PnL is not accumulated in the 'total_pnl'.
        # Is it in the HISTORY? 
        # My history implementation:
        # for t in trades_to_return: ...
        # If the trade is returned, it is in history.
        # But should `realizedPnl` accumulate it?
        # Warning: consistency.
        # If `total_pnl` excludes it, then `cum_realized` inside history loop should also?
        # Current implementation:
        # cum_realized += ev["realized"] -> This takes whatever closedPnl is on the trade.
        # But `trades_to_return` is list of Trade objects. They have `closedPnl`.
        # Is `closedPnl` set to 0 if tainted? No.
        # So History Accumulation needs to respect taint flag!
        
        # I need to FIX services.py to respect taint flag in history accumulation.
        # (Fix Applied). Now testing.
        
        # Use TestFundingLogic setup
        service = LedgerService(MockFundingDataSource())
        history = service.get_pnl_history("dummy", target_builder="0xBuilderA", builder_only=True)
        
        # Events:
        # 1. 1000: Open BTC (Tainted). Realized=0.
        # 2. 1500: Funding BTC (Tainted). Amount=50. Should be ignored.
        # 3. 2000: Close BTC (Tainted). PnL=1000. Should be ignored.
        # 4. 3000: Open ETH (Clean).
        # 5. 3500: Funding ETH (Clean). Amount=20. Included.
        # 6. 4000: Close ETH (Clean). PnL=100. Included.
        # 7. 5000: Funding (Clean). Amount=10. Included.
        
        # Expected Timeline (Cumulative Net PnL = Realized + Funding - Fees? fees are 0 in funding events)
        # Trades have fees. 
        
        # Let's verify final state of history
        last_entry = history[-1]
        
        # Realized: Only ETH trade (100). (BTC trade 1000 ignored).
        # Funding: ETH(20) + ETH(10) = 30. (BTC 50 ignored).
        # Fees: ETH Open(10) + ETH Close(5)? 
        # MockFundingDataSource fields: 
        #   ETH Open 3000: no fee specified in mock? Wait, MockFundingDataSource didn't specify fee.
        #   Let's check mock.
        #   MockFundingDataSource trades don't have 'fee' key!
        #   Service defaults fee to 0.0.
        
        self.assertEqual(last_entry.realizedPnl, Decimal("100.0")) 
        
        # Let's verify specific values
        # We expect some history entries
        self.assertTrue(len(history) > 0)
        
        # Check Net PnL of last entry
        # Realized(100) + Funding(30) = 130.
        self.assertEqual(last_entry.netPnl, Decimal("130.0"))
        pass

class MockFundingDataSource(DataSource):
    def get_user_fills(self, address: str) -> List[Any]:
        return [
            # Tainted Lifecycle (Builder Mismatch)
            # Open Long 1 BTC @ 50000 (Time 1000) - Builder A
            {"coin": "BTC", "side": "B", "sz": "1.0", "px": "50000.0", "time": 1000, "builder": "0xBuilderA"},
            # Close Long 1 BTC @ 51000 (Time 2000) - Builder B (TAINT!)
            {"coin": "BTC", "side": "A", "sz": "1.0", "px": "51000.0", "time": 2000, "builder": "0xBuilderB"},
            
            # Clean Lifecycle
            # Open Long 1 ETH @ 3000 (Time 3000) - Builder A
            {"coin": "ETH", "side": "B", "sz": "1.0", "px": "3000.0", "time": 3000, "builder": "0xBuilderA"},
            # Close Long 1 ETH @ 3100 (Time 4000) - Builder A
            {"coin": "ETH", "side": "A", "sz": "1.0", "px": "3100.0", "time": 4000, "builder": "0xBuilderA"}
        ]

    def get_user_funding(self, address: str, start_time: int, end_time: int) -> List[Any]:
        return [
            # Funding during Tainted BTC Lifecycle (1000-2000)
            {"coin": "BTC", "time": 1500, "usdc": "50.0"}, # Should be EXCLUDED in builderOnly
            
            # Funding during Clean ETH Lifecycle (3000-4000)
            {"coin": "ETH", "time": 3500, "usdc": "20.0"}, # Should be INCLUDED
            
            # Funding outside any lifecycle (e.g. 5000)
            {"coin": "ETH", "time": 5000, "usdc": "10.0"} # Should be INCLUDED? Or only open positions?
            # Current logic: Funding is point-in-time. If it's not in a tainted interval, it's included.
            # So this will be included.
        ]

    def get_all_mids(self): return {}

class TestFundingLogic(unittest.TestCase):
    def setUp(self):
        self.service = LedgerService(MockFundingDataSource())
        
    def test_funding_with_taint(self):
        # 1. Builder Only Mode
        data = self.service._process_ledger("dummy", target_builder="0xBuilderA", builder_only=True)
        pnl = data["pnl"]
        
        # BTC Lifecycle is Tainted (Builder B close). Interval: 1000-2000.
        # Funding at 1500 (50.0) should be EXCLUDED.
        
        # ETH Lifecycle is Clean. Interval: 3000-4000.
        # Funding at 3500 (20.0) should be INCLUDED.
        
        # Funding at 5000 (10.0) is outside tainted intervals. INCLUDED.
        
        # Total Expected Funding = 20.0 + 10.0 = 30.0
        self.assertEqual(pnl.fundingPaid, Decimal("30.0"))
        self.assertTrue(pnl.tainted) # Because BTC was tainted
        
    def test_funding_without_taint_check(self):
        # 2. All Trades Mode
        data = self.service._process_ledger("dummy", target_builder="0xBuilderA", builder_only=False)
        pnl = data["pnl"]
        
        # All funding included: 50 + 20 + 10 = 80
        self.assertEqual(pnl.fundingPaid, Decimal("80.0"))

if __name__ == '__main__':
    unittest.main()
