import asyncio
import json
import logging
from typing import Dict, List, Any
from fastapi import WebSocket
from hyperliquid.info import Info
from hyperliquid.utils.types import Any

class StreamManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(StreamManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self._info = None
        self.subscriptions: List[str] = []
        self._initialized = True
        self.logger = logging.getLogger("StreamManager")
        self.logger.setLevel(logging.INFO)

    def _get_info(self):
        if self._info is None:
            self._info = Info(skip_ws=False)
        return self._info

    async def connect(self, websocket: WebSocket, address: str):
        await websocket.accept()
        
        # Normalize address
        address = address.lower()
        
        if address not in self.active_connections:
            self.active_connections[address] = []
            # Subscribe to Upstream if first client
            self._subscribe_upstream(address)
            
        self.active_connections[address].append(websocket)
        self.logger.info(f"Client connected for {address}. Total: {len(self.active_connections[address])}")

    def disconnect(self, websocket: WebSocket, address: str):
        address = address.lower()
        if address in self.active_connections:
            if websocket in self.active_connections[address]:
                self.active_connections[address].remove(websocket)
            
            if not self.active_connections[address]:
                del self.active_connections[address]
                # Optional: Unsubscribe upstream to save bandwidth?
                # info.unsubscribe not always exposed cleanly or robustly in simple SDKs,
                # but we can try if implemented.
                # For now, keeping the subscription open is safer than flapping.

    def _subscribe_upstream(self, address: str):
        """Subscribe to Hyperliquid 'userFills' for the user."""
        subscription = {"type": "userFills", "user": address}
        
        def callback(data: Any):
            # This runs in a separate thread usually (SDK handled).
            # We need to broadcast.
            # Since broadcast is async (sending to websockets), we need to bridge sync->async.
            # However, SDK callbacks might be blocking or threaded.
            # We will try to run_coroutine_threadsafe if we have a loop, 
            # OR simple event loop scheduling.
            try:
                # Basic validation
                if get_address_from_data(data) == address:
                     asyncio.run(self.broadcast(address, data))
            except Exception as e:
                self.logger.error(f"Error in callback: {e}")

        # The SDK `subscribe` method is blocking or non-blocking?
        # Usually non-blocking register.
        # Note: The SDK callback signature depends on implementation.
        # Assuming `info.subscribe(topic, callback)`
        
        # Wrapper to capture specific address closure
        def specific_callback(data):
            # Data usually: {'channel': 'userFills', 'data': {...}}
            # We broadcast raw data
            # We need to schedule the async broadcast on the main event loop
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                     asyncio.run_coroutine_threadsafe(self.broadcast(address, data), loop)
            except RuntimeError: 
                # If no loop is found (e.g. valid thread issue), purely new loop?
                loop = asyncio.new_event_loop()
                loop.run_until_complete(self.broadcast(address, data))
                
        self._get_info().subscribe(subscription, specific_callback)
        self.logger.info(f"Subscribed upstream for {address}")

    async def broadcast(self, address: str, message: Any):
        address = address.lower()
        if address in self.active_connections:
            to_remove = []
            for connection in self.active_connections[address]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    self.logger.error(f"Error sending to client: {e}")
                    to_remove.append(connection)
            
            for dead in to_remove:
                self.disconnect(dead, address)

stream_manager = StreamManager()
