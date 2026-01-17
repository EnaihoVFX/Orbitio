from abc import ABC, abstractmethod
from typing import List, Any, Optional
from decimal import Decimal

class StorageBackend(ABC):
    @abstractmethod
    def get_latest_timestamp(self, user: str, coin: str = None) -> Optional[int]:
        """Get the timestamp (ms) of the most recent fill stored for this user."""
        pass

    @abstractmethod
    def save_fills(self, user: str, fills: List[Any]):
        """Save a list of raw fill dictionaries."""
        pass

    @abstractmethod
    def get_all_fills(self, user: str) -> List[Any]:
        """Retrieve all fills for a user."""
        pass
    
    @abstractmethod
    def get_leaderboard_stats(self, metric: str = "pnl") -> List[Any]:
        """Get aggregate stats for leaderboard."""
        pass
