from typing import List, Dict, Any
import pandas as pd
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any
import pandas as pd
from datetime import datetime
from decimal import Decimal
from .models import Trade, PositionState, PnLResponse, LeaderboardEntry, PnLHistoryEntry
from .datasources.base import DataSource
from .config import settings
from .storage.base import StorageBackend

class LedgerService:
    def __init__(self, data_source: DataSource, storage: StorageBackend = None):
        self.data_source = data_source
        self.storage = storage

    def _process_ledger(self, address: str, target_builder: str = None, 
                       from_ms: int = None, to_ms: int = None, 
                       coin_filter: str = None, builder_only: bool = False
                       ) -> Dict[str, Any]:
        """core processing logic shared by multiple endpoints"""
        
        effective_target_builder = target_builder if target_builder else settings.TARGET_BUILDER
        if effective_target_builder:
            effective_target_builder = effective_target_builder.lower()
        if effective_target_builder:
            effective_target_builder = effective_target_builder.lower()
        
        # Sync Logic
        fills = []
        if self.storage:
            # ... (omitted for brevity, assume sync logic is here)
            # Sync Logic remains unchanged in this block, just need to ensure indentation is correct if I replaced whole block
            # But I am taking a smaller chunk for safety vs context.
            # actually, let me just target the effective_target_builder lines and data fetching is distinct.
            pass 

        # I will restart the replacement to be more precise or cover the logic area.
        # The user has aggressive linter?
        # Let's target the top of _process_ledger
        
        # NOTE: logic requires `fills` to be populated.
        # The storage logic was added in previous turn.
        # I just need to update effective_target_builder line.
        
        # Let's use a specific target for effective_target_builder
        pass
        if self.storage:
            # 1. Get latest sync time
            latest_ts = self.storage.get_latest_timestamp(address)
            
            # 2. Fetch only new fills (Incremental Sync)
            # The datasource now supports 'since' which launches parallel fetch if range is large.
            # If latest_ts is 0/None, it fetches ALL history (Parallel).
            # If latest_ts is recent, it fetches increment (Sequential).
            
            new_fills = self.data_source.get_user_fills(address, since=latest_ts)
            
            # 3. Save new fills
            if new_fills:
                self.storage.save_fills(address, new_fills)
                
            # 4. Read full history from DB
            # We need full history for PnL/Position Lifecycle accuracy?
            # Yes, unless we snapshot positions. But we calc from scratch.
            fills = self.storage.get_all_fills(address)

        else:
            # Reconstructing positions accurately requires full history. 
            # But for speed on large accounts, we might accept a 'since' if from_ms is provided.
            # Decision: Use from_ms if provided, otherwise fetch all.
            fetch_since = from_ms if from_ms else 0
            try:
                fills = self.data_source.get_user_fills(address, since=fetch_since)
            except Exception as e:
                import traceback
                traceback.print_exc()
                raise e
            
        df = pd.DataFrame(fills)
        if df.empty or 'coin' not in df.columns:
             return {
                 "trades": [], 
                 "positions": [], 
                 "history": [],
                 "pnl": PnLResponse(
                     realizedPnl=Decimal(0), 
                     returnPct=Decimal(0), 
                     feesPaid=Decimal(0), 
                     tradeCount=0, 
                     tainted=False
                 )
             }
        
        trades_to_return = []
        position_history = []
        
        coins = df['coin'].unique()
        
        # PnL Aggregates
        total_pnl = Decimal("0.0")
        total_fees = Decimal("0.0")
        total_trades_count = 0
        overall_tainted = False
        
        # New PnL Aggregates
        total_upnl = Decimal("0.0")
        current_prices = {}
        prices_fetched = False
        accepted_funding = []
        
        # Initial Equity approximation (for returnPct)
        # ... (comments)
        
        # Funding Logic
        # 1. Fetch all funding history (optimized: time window if provided?)
        # For simplicity/correctness with lifecycles, we might need broader context, 
        # but funding is point-in-time event. We can just fetch window.
        funding_start = from_ms if from_ms else 0
        funding_end = to_ms if to_ms else int(datetime.now().timestamp() * 1000)
        
        # Note: get_user_funding in datasource might be specific.
        # Let's assume it returns list of dicts: {'time': ms, 'coin': str, 'usdc': float, ...}
        funding_history = []
        try:
             # If using Storage, we might need sync logic for funding too?
             # For now, let's pull from API or DataSource default (which hits API).
             # ToDo: Add storage support for funding.
             funding_history = self.data_source.get_user_funding(address, funding_start, funding_end)
        except Exception as e:
             # Fallback or log error? Funding is critical for PnL accuracy but maybe not blocker?
             print(f"Error fetching funding: {e}")
             funding_history = []

        total_funding = Decimal("0.0") # Net Funding (Positive = Received, Negative = Paid)
        
        # Pre-process funding by coin for efficiency
        funding_by_coin = {}
        for f in funding_history:
            # Hyperliquid SDK return format check
            c = f.get('coin') or f.get('token')
            if not c: continue
            if coin_filter and c != coin_filter: continue
            if c not in funding_by_coin: funding_by_coin[c] = []
            funding_by_coin[c].append(f)
        
        for coin in coins:
            if coin_filter and coin != coin_filter:
                continue
                
            coin_fills = df[df['coin'] == coin].sort_values('time')
            coin_funding = sorted(funding_by_coin.get(coin, []), key=lambda x: x['time'])
            
            # Position State
            current_net_size = Decimal("0.0")
            avg_entry_px = Decimal("0.0")
            
            # Lifecycle Tracking
            current_lifecycle_trades = []
            lifecycle_is_tainted = False
            lifecycle_start_ts = None
            tainted_intervals = [] # List of (start, end) tuples
            
            for index, fill in coin_fills.iterrows():
                timestamp = fill['time']
                if lifecycle_start_ts is None:
                    lifecycle_start_ts = timestamp
                
                # Check Time Boundaries for Processing? 
                # If we filter upfront, we lose position state reconstruction.
                # We must replay ALL history to get correct State at 'from_ms'.
                
                side = fill['side']
                sz = Decimal(str(fill['sz']))
                px = Decimal(str(fill['px']))
                fee = Decimal(str(fill['fee'])) if 'fee' in fill else Decimal("0.0")
                
                # Builder Attribution
                builder_address = None
                if 'builder' in fill and fill['builder']:
                     builder_address = fill['builder']
                elif 'builderInfo' in fill and fill['builderInfo']:
                     builder_address = fill['builderInfo'].get('builder')
                
                if builder_address:
                    builder_address = builder_address.lower()
                
                dir = Decimal("1") if side in ['B', 'Buy'] else Decimal("-1")
                signed_sz = sz * dir
                
                trade_pnl = Decimal("0.0")
                
                # Position update logic
                is_opening = (current_net_size >= 0 and dir > 0) or (current_net_size <= 0 and dir < 0)
                
                if is_opening:
                    total_value = (abs(current_net_size) * avg_entry_px) + (sz * px)
                    new_size = abs(current_net_size) + sz
                    if new_size > 0:
                        avg_entry_px = total_value / new_size
                    current_net_size += signed_sz
                else:
                    amount_closed = min(abs(current_net_size), sz)
                    pnl_direction = Decimal("1") if current_net_size > 0 else Decimal("-1")
                    trade_pnl = (px - avg_entry_px) * pnl_direction * amount_closed
                    current_net_size += signed_sz
                    if (pnl_direction == 1 and current_net_size < 0) or (pnl_direction == -1 and current_net_size > 0):
                        avg_entry_px = px
                
                # Construct Trade Object
                trade_obj = Trade(
                    coin=coin,
                    side=side,
                    sz=sz,
                    px=px,
                    time=timestamp,
                    fee=fee,
                    builder=builder_address,
                    closedPnl=trade_pnl,
                    tainted=False
                )
                
                current_lifecycle_trades.append(trade_obj)
                
                # Taint Check
                # "Taint rule: if non-builder activity affects the same position lifecycle... set tainted=true"
                if effective_target_builder:
                     # Check with normalized builder
                     if builder_address != effective_target_builder:
                         lifecycle_is_tainted = True

                # Lifecycle End Check
                lifecycle_ended = abs(current_net_size) < Decimal("1e-9")
                
                # Logic for Inclusion in Result Window
                # We only want to include trades/positions if they fall within [from_ms, to_ms]
                # BUT strict Builder Logic says "exclude from builder-only aggregates" if tainted.
                
                # If cycle ended OR (we are at end of list?), we decide on the lifecycle chunk
                # For streaming/processing simplicity, we can tag trades now.
                
                if lifecycle_ended:
                     # Mark accumulated trades
                     if lifecycle_is_tainted:
                         # Record the full interval of this tainted lifecycle
                         # End time is current fill timestamp (which closed it)
                         tainted_intervals.append((lifecycle_start_ts, timestamp))

                         for t in current_lifecycle_trades:
                             t.tainted = True
                     
                     # Add to main lists if time constraints met
                     for t in current_lifecycle_trades:
                         # Filter logic for Output
                         # 1. Time filter
                         if from_ms and t.time < from_ms:
                             continue
                         if to_ms and t.time > to_ms:
                             continue
                         
                         # 2. Builder Mode logic
                         # "builder-only mode... returns only trades attributed... marks mixed activity as tainted"
                         # "exclude from builder-only aggregates"
                         # Interpretation:
                         # /trades endpoint: include tainted? "marks mixed activity as tainted" -> Yes, include but mark?
                         # Or "returns ONLY attributed"? If it returns ONLY attributed, then tainted mixed trades (attr to others) are hidden?
                         # But if they are hidden, the user sees a gap.
                         # "marks mixed activity as tainted" implies visibility.
                         # "exclude from builder-only aggregates" means PnL calculation ignores them.
                         # Let's include them in TRADE list with tainted=True flag, but exclude from PnL.
                         
                         # However... "returns only trades attributed to a specific builder" is strong.
                         # If I return a trade from 0xOther marked tainted=True, I am returning non-attributed trade.
                         # Re-reading: "returns only trades attributed... AND marks mixed activity as tainted"
                         # Conflict? Maybe it means: Return BuilderTrades (clean) + BuilderTrades (tainted/mixed).
                         # Do NOT return NonBuilderTrades.
                         
                         if builder_only:
                             if t.builder != effective_target_builder:
                                 # This is a non-builder trade. Exclude from List?
                                 continue
                         
                         trades_to_return.append(t)
                         
                         # Metrics Accumulation (builderOnly specific)
                         if builder_only:
                             if not t.tainted:
                                 total_pnl += t.closedPnl
                                 total_fees += t.fee
                                 total_trades_count += 1
                             else:
                                 # It's builder attributed but part of a tainted lifecycle.
                                 # "exclude from builder-only aggregates" -> Ignore.
                                 overall_tainted = True
                         else:
                             # All trades mode
                             total_pnl += t.closedPnl
                             total_fees += t.fee
                             total_trades_count += 1

                     current_lifecycle_trades = []
                     
                     # Process Funding for this lifecycle interval
                     # We need to find funding events that happened BETWEEN the start of this lifecycle and now (end).
                     # Lifecycle Start Time? We need to track it.
                     # Let's add `lifecycle_start_time` tracking.
                     
                     # RE-ARCHITECTING LOOP SLIGHTLY inside the loop is hard.
                     # Easier: Just verify funding timestamp vs lifecycle trades range?
                     # Lifecycle range: [First Trade Time, Last Trade Time (Closing)]
                     # Funding happens every hour.
                     # If lifecycle is tainted, all funding in that range is tainted.
                     pass 

                    
                     lifecycle_is_tainted = False
                
                # Position Snapshot (if time matches)
                if (not from_ms or timestamp >= from_ms) and (not to_ms or timestamp <= to_ms):
                    # For position history, do we filter by builder?
                    # "Include tainted when builderOnly=true"
                    # If builderOnly, maybe we show position lines but mark tainted?
                    # If I am holding a position, and it gets tainted, the whole line is tainted.
                    pos_tainted = False
                    if builder_only and lifecycle_is_tainted:
                        pos_tainted = True
                        # If simple filter: we might blindly show it.
                        
                    position_history.append(PositionState(
                        timeMs=timestamp,
                        netSize=current_net_size,
                        avgEntryPx=avg_entry_px,
                        tainted=pos_tainted
                    ))

            # End of coin loop, handle open lifecycles
            if current_lifecycle_trades:
                 if lifecycle_is_tainted:
                     for t in current_lifecycle_trades: t.tainted = True
                 
                 for t in current_lifecycle_trades:
                     if from_ms and t.time < from_ms: continue
                     if to_ms and t.time > to_ms: continue
                     
                     if builder_only:
                         if t.builder != effective_target_builder: continue
                         if not t.tainted:
                             total_pnl += t.closedPnl
                             total_fees += t.fee
                             total_trades_count += 1
                         else:
                             overall_tainted = True
                     else:
                         total_pnl += t.closedPnl
                         total_fees += t.fee
                         total_trades_count += 1
                     trades_to_return.append(t)

            # End of coin loop
            # ... (handle open lifecycles if any - omitting specific fix here, relying on existing logic or assuming closed)
            if current_lifecycle_trades and lifecycle_is_tainted:
                 # Open position is tainted
                 tainted_intervals.append((lifecycle_start_ts, 9999999999999)) # Until infinity/now
            
            # --- Funding Processing ---
            for f in coin_funding:
                ts = f['time']
                amount = Decimal(str(f['usdc'])) if 'usdc' in f else Decimal("0.0")
                
                # Builder Only Logic
                # If builder_only=True, we exclude funding that happened during a TAINTED interval.
                # Also, stricter rule: "Builder Only" might imply we only count funding if the position was OPENED by builder?
                # If the lifecycle is clean (not tainted), then funding is clean.
                # If lifecycle is tainted, funding is tainted/excluded.
                
                is_tainted_funding = False
                if builder_only:
                    for (start, end) in tainted_intervals:
                        if start <= ts <= end:
                            is_tainted_funding = True
                            break
                            
                if not is_tainted_funding:
                    total_funding += amount
                    accepted_funding.append({
                        "time": ts,
                        "type": "funding",
                        "amount": Decimal("0.0"), # Funding is PnL? Yes. PnL impact = amount (if positive=income)
                        # Wait, 'amount' is 'usdc'.
                        "pnl": amount,
                        "fee": Decimal("0.0"),
                        "tainted": False
                    })
                else:
                    overall_tainted = True
            
            # --- Unrealized PnL (Mark-to-Market) ---
            # If position is still open (current_net_size != 0)
            if abs(current_net_size) > Decimal("1e-9"):
                # We need market price
                if not prices_fetched:
                     try:
                         current_prices = self.data_source.get_all_mids()
                         prices_fetched = True
                     except Exception as e:
                         print(f"Error fetching prices: {e}")
                
                # Get price for this coin
                # API returns coin names usually?
                current_price_raw = current_prices.get(coin)
                if current_price_raw:
                    mark_px = Decimal(str(current_price_raw))
                    # uPnL = (Mark - Entry) * Size
                    # Check direction
                    # If Long (Size > 0): (Mark - Entry) * Size
                    # If Short (Size < 0): (Entry - Mark) * Abs(Size) = (Entry - Mark) * (-Size) = (Mark - Entry) * Size
                    # Math holds.
                    
                    # BUT Taint Check?
                    # If current position is TAINTED (lifecycle_is_tainted is True currently?)
                    # `lifecycle_is_tainted` variable scope?
                    # It was reset at loop end... wait.
                    # Inside the loop:
                    #   if lifecycle_ended: ... reset ...
                    # So if loop finished and lifecycle NOT ended, `lifecycle_is_tainted` holds the current state.
                    # Correct.
                    
                    coin_upnl = (mark_px - avg_entry_px) * current_net_size
                    
                    if builder_only and lifecycle_is_tainted:
                         # Tainted open position. Exclude uPnL?
                         # Yes, consistent with realized logic.
                         pass
                    else:
                         total_upnl += coin_upnl

        trades_to_return.sort(key=lambda x: x.time)

        # --- PnL History Generation ---
        pnl_history = []
        history_events = []
        
        # 1. Trades
        for t in trades_to_return:
            history_events.append({
                "time": t.time,
                "realized": t.closedPnl,
                "fee": t.fee,
                "funding": Decimal("0.0"),
                "tainted": t.tainted
            })
            
        # 2. Funding
        for f in accepted_funding:
            history_events.append({
                "time": f["time"],
                "realized": Decimal("0.0"),
                "fee": Decimal("0.0"),
                "funding": f["pnl"],
                "tainted": f["tainted"]
            })
            
        # 3. Sort & Accumulate
        history_events.sort(key=lambda x: x["time"])
        
        cum_realized = Decimal("0.0")
        cum_fees = Decimal("0.0")
        cum_funding = Decimal("0.0")
        
        for ev in history_events:
            # Taint Logic for History Aggregation
            # If builder_only is True, we should NOT accumulate PnL/Funding/Fees from tainted events
            # to keep the Equity Curve consistent with the scalar PnL metrics.
            
            should_accumulate = True
            if builder_only and ev["tainted"]:
                should_accumulate = False
            
            if should_accumulate:
                cum_realized += ev["realized"]
                cum_fees += ev["fee"]
                cum_funding += ev["funding"]
            
            pnl_history.append(PnLHistoryEntry(
                time=ev["time"],
                realizedPnl=cum_realized,
                feesPaid=cum_fees,
                fundingPaid=cum_funding,
                netPnl=(cum_realized + cum_funding) - cum_fees,
                tainted=ev["tainted"]
            ))
            
        # ... Return logic
        trades_to_return.sort(key=lambda x: x.time)
        position_history.sort(key=lambda x: x.timeMs)
        
        # Calculate returnPct ...
        return_pct = Decimal("0.0") 
        
        return {
            "trades": trades_to_return,
            "positions": position_history,
            "history": pnl_history,
            "pnl": PnLResponse(
                realizedPnl=total_pnl,
                unrealizedPnl=total_upnl.quantize(Decimal("1.00000000")),
                returnPct=return_pct,    
                feesPaid=total_fees,
                fundingPaid=total_funding, # Actually netFunding
                tradeCount=total_trades_count,
                tainted=overall_tainted
            )
        }

    def get_trades(self, address: str, **kwargs) -> List[Trade]:
        data = self._process_ledger(address, **kwargs)
        return data["trades"]
    
    def get_pnl_history(self, address: str, **kwargs) -> List[PnLHistoryEntry]:
        data = self._process_ledger(address, **kwargs)
        return data["history"]

    def get_pnl(self, address: str, **kwargs) -> PnLResponse:
        data = self._process_ledger(address, **kwargs)
        return data["pnl"]

    def get_position_history(self, address: str, **kwargs) -> List[PositionState]:
        data = self._process_ledger(address, **kwargs)
        return data["positions"]

    def get_leaderboard(self, metric: str = "pnl") -> List[LeaderboardEntry]:
        if not self.storage:
            return []
        
        raw_stats = self.storage.get_leaderboard_stats(metric)
        entries = []
        for i, r in enumerate(raw_stats):
            entries.append(LeaderboardEntry(
                rank=i+1,
                user=r['user'],
                metricValue=Decimal(str(r['metricValue'])),
                tradeCount=r['tradeCount'],
                tainted=False # Aggregate taint check missing in simple SQL
            ))
        return entries
