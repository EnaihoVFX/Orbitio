# Hyperliquid Trade Ledger Service

**Production-ready API service for tracking Hyperliquid user performance, PnL, and Builder-Only Leaderboards.**

This service provides a standardized `/v1/` API to query reconstructed position lifecycles, trade history, and aggregate PnL. It supports a strict **Builder-Only Mode** to attribute volume and PnL to specific frontend integrations (Builders).

## 🚀 Quick Start (Single Command)

You can run the full service with persistence enabled using `docker-compose`:

```bash
docker-compose up --build
```

The API will be available at: `http://localhost:8000`

### Configuration

You can configure the service via environment variables in `docker-compose.yml` or a `.env` file:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `TARGET_BUILDER` | *None* | (Optional) Default Builder Address to filter by. |
| `STORAGE_TYPE` | `sqlite` | Persistence backend: `memory` or `sqlite`. |
| `DATABASE_URL` | `sqlite:///data/hyperliquid.db` | Connection string for the database. |

---

## 🏗️ Builder-Only Mode

This mode is designed for competitions or analytics where you need to verify that a user's performance is strictly attributable to your platform.

### How it Works
1.  **Attribution**: The service checks the `builder` field in every trade fill fetched from the Hyperliquid API.
2.  **Normalization**: Addresses are automatically normalized to lowercase to prevent casing mismatches (e.g., `0xBuilder` == `0xbuilder`).
3.  **Taint Logic**: 
    - A **Position Lifecycle** starts when a user opens a position (Size > 0) and ends when they close it completely (Size == 0).
    - If **ANY** trade within a lifecycle is *not* attributed to your `TARGET_BUILDER`, the **ENTIRE** lifecycle is marked as **Tainted**.
    - Tainted lifecycles are excluded from `realizedPnl`, `feesPaid`, and `returnPct` aggregates.
    
    > **Note**: Tainted trades are still returned in the list response with `tainted: true` for debugging purposes.

For a deep dive into the logic, see [TAINT_ARCHITECTURE.md](TAINT_ARCHITECTURE.md).

---

## 🛠️ API Reference

### 1. Get Trades
Returns comprehensive trade history with PnL and fee data.

```http
GET /v1/trades?user=0x...&builderOnly=true
```

### 2. Get PnL
Returns aggregate performance metrics.

```http
GET /v1/pnl?user=0x...&builderOnly=true
```
**Response:**
```json
{
  "realizedPnl": "1250.50",
  "feesPaid": "10.20",
  "tradeCount": 42,
  "tainted": false
}
```

### 3. Leaderboard (Requires Persistence)
Returns top users by Realized PnL.

```http
GET /v1/leaderboard
```

---

## ⚠️ Limitations & Assumptions

1.  **Public API Source**: This service uses the public Hyperliquid Info API. It assumes the API is available and rate limits are respected (automatic retries are implemented).
2.  **Data Gaps**: If the API returns historical fills without `builderInfo` (rare, but possible for very old trades), they may be treated as non-builder trades.
3.  **Return %**: The `returnPct` metric currently returns `0.0`. Calculating true ROI requires accurate "Equity at Start" or "Net Deposits" data, which is not fully exposed in the public `userFills` endpoint.
4.  **Taint Irreversibility**: A position once tainted cannot be "cleaned" until it is fully closed.

---

## 📂 Project Structure

- `src/main.py`: FastAPI application entry point.
- `src/services.py`: Core business logic (PnL calculation, Taint checking).
- `src/storage/`: persistence layers (`sqlite.py`, `base.py`).
- `src/datasources/`: Data ingestion adapters (`hyperliquid.py`).

## 🧪 Testing

Run strict logic tests inside the container:

```bash
docker-compose run hyperliquid-ledger python3 -m unittest discover tests
```
