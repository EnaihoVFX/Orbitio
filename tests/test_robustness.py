import unittest
from unittest.mock import MagicMock, patch
import sys

# Mock external dependency
sys.modules['hyperliquid'] = MagicMock()
sys.modules['hyperliquid.info'] = MagicMock()

# Mock tenacity
mock_tenacity = MagicMock()
def mock_retry(*args, **kwargs):
    def decorator(f):
        return f
    return decorator
mock_tenacity.retry = mock_retry
mock_tenacity.stop_after_attempt = MagicMock()
mock_tenacity.wait_fixed = MagicMock()
sys.modules['tenacity'] = mock_tenacity

from src.datasources.hyperliquid import HyperliquidDataSource

class TestHyperliquidPagination(unittest.TestCase):
    def setUp(self):
        self.ds = HyperliquidDataSource()
        # Mock the info object
        self.ds.info = MagicMock()

    def test_pagination_logic(self):
        # Setup mock to return chunks
        # Chunk 1: 2000 items (full page), timestamps 0 to 1999
        # Chunk 2: 500 items, timestamps 2000 to 2499
        # Chunk 3: Empty (end)
        
        chunk1 = [{'time': i, 'id': i} for i in range(2000)]
        chunk2 = [{'time': i, 'id': i} for i in range(2000, 2500)]
        
        # We need to mock _fetch_fills_chunk to return these in sequence
        # The logic calls _fetch_fills_chunk(address, start_time)
        
        def side_effect(address, start_time=0):
            if start_time == 0:
                return chunk1
            elif start_time == 2000: # Last timestamp (1999) + 1
                return chunk2
            elif start_time == 2500: # Last timestamp (2499) + 1
                return []
            return []

        # We can't easily mock the internal method _fetch_fills_chunk if checking the loop logic 
        # unless we subclass or patch. Patch is cleaner.
        
        with patch.object(self.ds, '_fetch_fills_chunk', side_effect=side_effect) as mock_fetch:
            all_fills = self.ds.get_user_fills("dummy")
            
            self.assertEqual(len(all_fills), 2500)
            self.assertEqual(all_fills[0]['time'], 0)
            self.assertEqual(all_fills[-1]['time'], 2499)
            
            # verify call arguments logic
            # call 1: start_time=0
            # call 2: start_time=2000
            # call 3 not needed as chunk 2 was < 2000
            self.assertEqual(mock_fetch.call_count, 2)
            mock_fetch.assert_any_call("dummy", 0)
            mock_fetch.assert_any_call("dummy", 2000)

if __name__ == '__main__':
    unittest.main()
