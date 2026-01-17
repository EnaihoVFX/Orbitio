from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
import logging
import os

# Load environment variables first
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Now we can safely import local modules that might rely on env vars at module level
from .services import LedgerService
from .datasources.hyperliquid import HyperliquidDataSource
from .config import settings
from .storage.sqlite import SqliteStorage
from .stream_manager import stream_manager
from .middleware import TelemetryMiddleware, verify_api_key
from .routers import admin
from .routers import auth as auth_router
from .database import init_db

app = FastAPI(title="Hyperliquid Trade Ledger Service")

# Initialize database
init_db()

# Rate Limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Get allowed origins from environment
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174').split(',')

# CORS Middleware with specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["X-API-Key", "Content-Type", "Authorization"],
    max_age=3600,
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response

# Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url.path}")
    logger.info(f"Client IP: {request.client.host if request.client else 'unknown'}")
    api_key = request.headers.get('X-API-Key', 'No API Key')
    logger.info(f"API Key: {api_key[:10]}..." if len(api_key) > 10 else "API Key: None")
    
    response = await call_next(request)
    
    logger.info(f"Response: {response.status_code}")
    return response

app.add_middleware(TelemetryMiddleware)

# Include routers
app.include_router(auth_router.router)
app.include_router(admin.router)

# Dependency Injection
data_source = HyperliquidDataSource()

# Initialize Storage
storage_backend = None
if settings.STORAGE_TYPE == "sqlite":
    storage_backend = SqliteStorage(settings.DATABASE_URL)
# elif settings.STORAGE_TYPE == "postgres":
#     ...

service = LedgerService(data_source, storage=storage_backend)

@app.get("/v1/trades", dependencies=[Depends(verify_api_key)])
@limiter.limit(os.getenv('RATE_LIMIT_PER_MINUTE', '10') + "/minute")
def get_trades(request: Request, user: str, coin: str = None, fromMs: int = None, toMs: int = None, builderOnly: bool = False):
    # Map 'user' to logic 'address'
    if not user:
        raise HTTPException(status_code=400, detail="User address required")
    try:
        data = service.get_trades(user, coin_filter=coin, from_ms=fromMs, to_ms=toMs, builder_only=builderOnly)
        return data
    except Exception as e:
        logger.error(f"Error in get_trades: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/positions/history", dependencies=[Depends(verify_api_key)])
@limiter.limit(os.getenv('RATE_LIMIT_PER_MINUTE', '10') + "/minute")
def get_positions(request: Request, user: str, coin: str = None, fromMs: int = None, toMs: int = None, builderOnly: bool = False):
    if not user:
        raise HTTPException(status_code=400, detail="User address required")
    try:
        data = service.get_position_history(user, coin_filter=coin, from_ms=fromMs, to_ms=toMs, builder_only=builderOnly)
        return data
    except Exception as e:
        logger.error(f"Error in get_positions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/pnl", dependencies=[Depends(verify_api_key)])
@limiter.limit(os.getenv('RATE_LIMIT_PER_MINUTE', '10') + "/minute")
def get_pnl(request: Request, user: str, coin: str = None, fromMs: int = None, toMs: int = None, target_builder: str = settings.TARGET_BUILDER, builderOnly: bool = True):
    if not user:
        raise HTTPException(status_code=400, detail="User address required")
    try:
        data = service.get_pnl(user, coin_filter=coin, from_ms=fromMs, to_ms=toMs, target_builder=target_builder, builder_only=builderOnly)
        return data
    except Exception as e:
        logger.error(f"Error in get_pnl: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/pnl/history", dependencies=[Depends(verify_api_key)])
@limiter.limit(os.getenv('RATE_LIMIT_PER_MINUTE', '10') + "/minute")
def get_pnl_history(request: Request, user: str, coin: str = None, fromMs: int = None, toMs: int = None, target_builder: str = settings.TARGET_BUILDER, builderOnly: bool = True):
    if not user:
        raise HTTPException(status_code=400, detail="User address required")
    try:
        data = service.get_pnl_history(user, coin_filter=coin, from_ms=fromMs, to_ms=toMs, target_builder=target_builder, builder_only=builderOnly)
        return data
    except Exception as e:
        logger.error(f"Error in get_pnl_history: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/leaderboard")
@limiter.limit(os.getenv('RATE_LIMIT_PER_MINUTE', '10') + "/minute")
def get_leaderboard(request: Request, coin: str = None, fromMs: int = None, toMs: int = None, metric: str = "pnl", builderOnly: bool = True, maxStartCapital: float = 1000):
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
