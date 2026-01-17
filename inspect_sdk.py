import hyperliquid
import inspect
from hyperliquid.utils import types
try:
    from hyperliquid.exchange import Exchange
    from hyperliquid.info import Info
    print("Exchange and Info found.")
except ImportError:
    print("Core classes missing.")

import hyperliquid.utils
print("Utils contents:", dir(hyperliquid.utils))
