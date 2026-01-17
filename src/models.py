from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, field_validator
import re

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
    
    @field_validator('builder')
    @classmethod
    def validate_builder_address(cls, v):
        if v is not None and not re.match(r'^0x[a-fA-F0-9]{40}$', v):
            raise ValueError('Invalid Ethereum address format for builder')
        return v.lower() if v else v

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
    
    @field_validator('address')
    @classmethod
    def validate_address(cls, v):
        if not re.match(r'^0x[a-fA-F0-9]{40}$', v):
            raise ValueError('Invalid Ethereum address format')
        return v.lower()

class UserAddressRequest(BaseModel):
    """Request model for validating user addresses"""
    user: str
    
    @field_validator('user')
    @classmethod
    def validate_user_address(cls, v):
        # Validate Ethereum address format
        if not re.match(r'^0x[a-fA-F0-9]{40}$', v):
            raise ValueError('Invalid Ethereum address format. Must be 0x followed by 40 hexadecimal characters')
        # Normalize to lowercase
        return v.lower()
