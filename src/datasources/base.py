from abc import ABC, abstractmethod
from typing import List, Any, Dict
from ..models import Trade

class DataSource(ABC):
    @abstractmethod
    def get_user_fills(self, address: str, since: int = 0) -> List[Any]:
        """Fetch user trade history/fills."""
        pass
    
    @abstractmethod
    def get_user_funding(self, address: str, start_time: int, end_time: int) -> List[Any]:
        """Fetch funding history for the user."""
        pass

    @abstractmethod
    def get_user_positions(self, address: str) -> List[Any]:
        """Fetch current open positions."""
        pass

    @abstractmethod
    def get_all_mids(self) -> Dict[str, float]:
        """Fetch current mid prices for all assets."""
        pass
