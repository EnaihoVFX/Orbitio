from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel

class Trade(BaseModel):
    coin: str
    side: str
    sz: Decimal
    px: Decimal
    time: int
    fee: Decimal
    builder: Optional[str] = None
    closedPnl: Decimal = Decimal("0.0")
    tainted: bool = False

class PositionState(BaseModel):
    timeMs: int
    netSize: Decimal
    avgEntryPx: Decimal
    tainted: bool = False

class PnLResponse(BaseModel):
    realizedPnl: Decimal
    unrealizedPnl: Decimal = Decimal("0.0")
    returnPct: Decimal
    feesPaid: Decimal
    fundingPaid: Decimal = Decimal("0.0") 
    tradeCount: int
    tainted: bool = False

class PnLHistoryEntry(BaseModel):
    time: int
    realizedPnl: Decimal
    feesPaid: Decimal
    fundingPaid: Decimal
    netPnl: Decimal
    tainted: bool = False
    
class LeaderboardEntry(BaseModel):
    address: str
    pnl: Decimal
    roi: Decimal
    trades: int
