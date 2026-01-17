from hyperliquid.info import Info
from hyperliquid.exchange import Exchange

print("Info methods:", [m for m in dir(Info) if not m.startswith("_")])
print("Exchange methods:", [m for m in dir(Exchange) if not m.startswith("_")])

# Check for websocket related attributes
import hyperliquid
print("Root hyperliquid contents:", dir(hyperliquid))
