from fastapi import Request, HTTPException, Security, Depends
from fastapi.security.api_key import APIKeyHeader
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
from .database import SessionLocal, APIKey, RequestLog

# Header scheme
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)):
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing API Key")
    
    # Use SQLAlchemy session
    db = SessionLocal()
    try:
        key_record = db.query(APIKey).filter(APIKey.key == api_key, APIKey.is_active == True).first()
        if not key_record:
             raise HTTPException(status_code=403, detail="Invalid or Inactive API Key")
        return {"id": key_record.id, "name": key_record.name} # Return dict for compatibility
    finally:
        db.close()

class TelemetryMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        process_time = time.time() - start_time
        latency_ms = process_time * 1000
        
        # Extract info
        endpoint = request.url.path
        
        # Skip logging for admin endpoints and favicon to avoid noise
        if endpoint.startswith("/admin") or endpoint.startswith("/docs") or endpoint == "/openapi.json" or endpoint == "/favicon.ico":
             return response

        api_key = request.headers.get("X-API-Key")
        status_code = response.status_code
        
        # Try to extract 'user' from query params if PnL endpoint
        user_addr = request.query_params.get("user")
        
        # Sync Log via SQLAlchemy
        try:
            db = SessionLocal()
            log_entry = RequestLog(
                endpoint=endpoint,
                status_code=status_code,
                latency_ms=latency_ms,
                api_key=api_key,
                user_addr=user_addr
            )
            db.add(log_entry)
            db.commit()
            db.close()
        except Exception as e:
            print(f"Logging Error: {e}")
            
        return response
