from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from .services import LedgerService
from .datasources.hyperliquid import HyperliquidDataSource
from .config import settings
from .storage.sqlite import SqliteStorage
from .stream_manager import stream_manager

app = FastAPI(title="Hyperliquid Trade Ledger Service")

# Dependency Injection
data_source = HyperliquidDataSource()

# Initialize Storage
storage_backend = None
if settings.STORAGE_TYPE == "sqlite":
    storage_backend = SqliteStorage(settings.DATABASE_URL)
# elif settings.STORAGE_TYPE == "postgres":
#     ...

service = LedgerService(data_source, storage=storage_backend)

@app.get("/v1/trades")
def get_trades(user: str, coin: str = None, fromMs: int = None, toMs: int = None, builderOnly: bool = False):
    # Map 'user' to logic 'address'
    if not user:
        raise HTTPException(status_code=400, detail="User address required")
    try:
        data = service.get_trades(user, coin_filter=coin, from_ms=fromMs, to_ms=toMs, builder_only=builderOnly)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/positions/history")
def get_positions(user: str, coin: str = None, fromMs: int = None, toMs: int = None, builderOnly: bool = False):
    if not user:
        raise HTTPException(status_code=400, detail="User address required")
    try:
        data = service.get_position_history(user, coin_filter=coin, from_ms=fromMs, to_ms=toMs, builder_only=builderOnly)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/pnl")
def get_pnl(user: str, coin: str = None, fromMs: int = None, toMs: int = None, target_builder: str = settings.TARGET_BUILDER, builderOnly: bool = True):
    if not user:
        raise HTTPException(status_code=400, detail="User address required")
    try:
        data = service.get_pnl(user, coin_filter=coin, from_ms=fromMs, to_ms=toMs, target_builder=target_builder, builder_only=builderOnly)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/pnl/history")
def get_pnl_history(user: str, coin: str = None, fromMs: int = None, toMs: int = None, target_builder: str = settings.TARGET_BUILDER, builderOnly: bool = True):
    if not user:
        raise HTTPException(status_code=400, detail="User address required")
    try:
        data = service.get_pnl_history(user, coin_filter=coin, from_ms=fromMs, to_ms=toMs, target_builder=target_builder, builder_only=builderOnly)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/leaderboard")
def get_leaderboard(coin: str = None, fromMs: int = None, toMs: int = None, metric: str = "pnl", builderOnly: bool = True, maxStartCapital: float = 1000):
    # Only works if persistence is enabled
    if not service.storage:
        return [] # Or raise 501 Not Implemented? Return empty for now.
    
    return service.get_leaderboard(metric)

@app.websocket("/ws/events/{address}")
async def websocket_endpoint(websocket: WebSocket, address: str):
    await stream_manager.connect(websocket, address)
    try:
        while True:
            # Keep alive / listen for client messages (optional: echo or command)
            # We just wait for disconnect
            await websocket.receive_text() 
    except WebSocketDisconnect:
        stream_manager.disconnect(websocket, address)

@app.get("/health")
def health_check():
    return {"status": "ok"}
