from typing import List, Any, Dict
from hyperliquid.info import Info
from .base import DataSource
from tenacity import retry, stop_after_attempt, wait_fixed

class HyperliquidDataSource(DataSource):
    def __init__(self, use_mainnet: bool = True):
        self._info = None

    @property
    def info(self):
        if self._info is None:
            self._info = Info(skip_ws=True)
        return self._info

    def get_user_fills(self, address: str, since: int = 0) -> List[Any]:
        return self._get_all_user_fills(address, since)

    @retry(stop=stop_after_attempt(5), wait=wait_fixed(5))
    def _fetch_fills_chunk(self, address: str, start_time: int = 0) -> List[Any]:
        if hasattr(self.info, 'user_fills_by_time'):
            return self.info.user_fills_by_time(address, start_time)
        else:
            return self.info.user_fills(address)

    def _fetch_range(self, address: str, start_ts: int, end_ts: int) -> List[Any]:
        """Fetch fills sequentially within a specific time window [start_ts, end_ts]."""
        import time
        fills = []
        current_start = start_ts
        
        while True:
            # We don't want to fetch beyond end_ts if possible, but the API start_time is inclusive.
            if current_start > end_ts:
                break
                
            # Rate Limit Enforcement: Sleep 0.05s between chunks
            # 20 requests per second max
            time.sleep(0.05)
            
            try:
                chunk = self._fetch_fills_chunk(address, current_start)
                # Debug print to see progress
                print(f"Fetched chunk start={current_start} count={len(chunk)}")
            except Exception as e:
                print(f"Error fetching chunk at {current_start}: {e}")
                # If it's a 429, maybe wait longer?
                # For now, break or retry? Breaking saves the crash but returns partial data.
                # Let's simple break to keep the server alive.
                print("Returning partial data to prevent crash.")
                break

            if not chunk:
                break
            
            # Filter chunk to ensure we don't exceed end_ts logic strictly?
            # API returns fills >= current_start.
            # We iterate through chunk.
            
            chunk_in_range = []
            max_ts_in_chunk = 0
            
            for fill in chunk:
                ts = fill['time']
                if ts > end_ts:
                    continue # Ignore fills beyond our segment end
                chunk_in_range.append(fill)
                max_ts_in_chunk = max(max_ts_in_chunk, ts)
            
            fills.extend(chunk_in_range)
            
            # Pagination Check
            if len(chunk) < 2000:
                # End of stream reached naturally
                break
            
            last_ts_raw = chunk[-1]['time']
            
            # If the raw last timestamp exceeded our window, we are done with this segment.
            if last_ts_raw > end_ts:
                break
                
            if last_ts_raw <= current_start:
                # Anti-loop
                break
                
            current_start = last_ts_raw + 1
            
        return fills

    def _get_all_user_fills(self, address: str, since: int = 0) -> List[Any]:
        import concurrent.futures
        from datetime import datetime
        
        now_ms = int(datetime.now().timestamp() * 1000)
        start_ms = since if since > 0 else 0
        
        # Heuristic: If fetching small range (< 7 days), sequential is faster/safer
        ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
        if (now_ms - start_ms) < ONE_WEEK_MS:
             return self._fetch_range(address, start_ms, now_ms + ONE_WEEK_MS)
        
        # Parallel Segmentation
        total_duration = now_ms - start_ms
        num_workers = 1 # Force Sequential to prevent 429 Errors in Demo
        segment_size = total_duration // num_workers
        
        futures = []
        all_fills = []
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=num_workers) as executor:
            for i in range(num_workers):
                seg_start = start_ms + (i * segment_size)
                # Last segment goes to 'now' + buffer
                seg_end = (start_ms + ((i + 1) * segment_size)) - 1 if i < num_workers - 1 else now_ms + ONE_WEEK_MS
                
                futures.append(executor.submit(self._fetch_range, address, int(seg_start), int(seg_end)))
                
            for future in concurrent.futures.as_completed(futures):
                try:
                    res = future.result()
                    all_fills.extend(res)
                except Exception as e:
                    print(f"Error in parallel fetch: {e}")
                    raise e
        
        # Sort and Deduplicate based on 'time' and maybe 'hash'? 
        # (Parallel boundaries might overlap slightly if not careful, but strict time check above handles it)
        # Deduplication is safer.
        # Unique key: (time, hash at best? or just python object id if exact dict?)
        # Let's verify via hash/tid if available, or just distinct dicts.
        # Assuming list of dicts.
        
        # Sort by time
        all_fills.sort(key=lambda x: x['time'])
        
        # Simple dedupe by unique ID if available ('hash' or 'tid') or just time+coin+side+sz?
        # Fills usually have 'hash'.
        # Let's do a robust dedupe.
        seen_hashes = set()
        unique_fills = []
        for f in all_fills:
            # Hash is robust unique ID for fills
            tid = f.get('hash') 
            if tid:
                if tid in seen_hashes:
                    continue
                seen_hashes.add(tid)
                unique_fills.append(f)
            else:
                # Fallback if no hash?
                unique_fills.append(f)
                
        return unique_fills

    def get_user_funding(self, address: str, start_time: int, end_time: int) -> List[Any]:
        return self.info.user_funding_history(address, start_time, end_time)

    def get_user_positions(self, address: str) -> List[Any]:
        state = self.info.clearinghouse_state(address)
        return state.get('assetPositions', [])

    def get_all_mids(self) -> Dict[str, float]:
        # returns dict: {"ETH": "1800.5", ...} (strings or floats depending on SDK)
        # SDK all_mids() usually returns raw dictionary from API
        return self.info.all_mids()
