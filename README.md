# Orbitio (PeakPNL) 🛰️

**Official Hyperliquid Partner Validation & Analytics Platform**

Orbitio is a specialized analytics dashboard designed for Hyperliquid builders, specifically tailored for the **Hyperliquid Hackathon Builder-Only Challenge**. It provides a real-time ledger of user activity, calculating accurate PnL, and validating "exclusive builder" status for users.

---
##Screenshots
<img width="1458" height="956" alt="Screenshot 2026-01-18 at 03 30 55" src="https://github.com/user-attachments/assets/44401aae-d479-4181-9072-d71e2b4c8e43" />
<img width="1459" height="956" alt="Screenshot 2026-01-18 at 03 30 47" src="https://github.com/user-attachments/assets/bf29d879-6f6e-40b5-b677-457261d18805" />
<img width="1435" height="956" alt="Screenshot 2026-01-18 at 03 29 10" src="https://github.com/user-attachments/assets/9a87c1dd-6e68-4cf2-949a-831dd162985a" />
<img width="1455" height="956" alt="Screenshot 2026-01-18 at 03 29 03" src="https://github.com/user-attachments/assets/a93697d2-d9ed-4492-aa9c-160c61905776" />
<img width="1461" height="956" alt="Screenshot 2026-01-18 at 03 28 50" src="https://github.com/user-attachments/assets/95b6f61a-03bc-4e30-bec2-aea3b6c269e3" />
<img width="1466" height="956" alt="Screenshot 2026-01-18 at 03 28 42" src="https://github.com/user-attachments/assets/52591338-4a6f-41b0-af7a-796fa3631d7a" />
<img width="1461" height="956" alt="Screenshot 2026-01-18 at 03 28 31" src="https://github.com/user-attachments/assets/ac7eadac-87db-495a-87c7-49d657f8507e" />
<img width="1462" height="956" alt="Screenshot 2026-01-18 at 03 27 40" src="https://github.com/user-attachments/assets/8194b44f-9d59-4d4a-8f3e-d53759443636" />
<img width="1459" height="956" alt="Screenshot 2026-01-18 at 03 27 26" src="https://github.com/user-attachments/assets/afa4607e-cbda-46fc-a1f7-a51ebc42d838" />

## 🚀 Quick Start (One-Command Run)

We have containerized the entire stack for easy deployment. Prerequisites: `Docker` and `Docker Compose`.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/EnaihoVFX/Orbitio.git
   cd Orbitio
   ```

2. **Run the stack:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   *   **Frontend (App):** [http://localhost:4173](http://localhost:4173)
   *   **Backend (API):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛠 Environmental Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Checkpointing database path (DB is auto-created) | `sqlite:///data/hyperliquid.db` |
| `TARGET_BUILDER` | Default Builder Address to attribute trades to | *(Optional)* |
| `ALLOWED_ORIGINS` | CORS allowed origins | `localhost` variants |
| `VITE_API_URL` | Frontend API endpoint target | `http://localhost:8000` |

---

## 🧱 Builder-Only Functionality

This project implements the **"Builder-Only"** challenge requirements by analyzing a user's entire trade history on Hyperliquid L1.

### How Attribution Works (Logic)
The core logic resides in `src/services.py` -> `calculate_pnl`.

1.  **Fetch History**: We pull all user fills (trades) from the Hyperliquid Info API.
2.  **Filter by Builder**: Each fill is inspected for the `builder` field.
3.  **Taint Analysis**:
    *   If a user has **ANY** trade where `fill['builder'] != TARGET_BUILDER`, the user is marked as **TAINTED**.
    *   If `builderOnly=True` is requested, the PnL calculation strictly aggregates *only* trades attributed to the specific builder.
4.  **Verification Result**: The API returns a `tainted` boolean.
    *   `tainted: false` = **Exclusive User** (100% loyalty).
    *   `tainted: true` = **Mixed User** (Has traded with other interfaces).

### API Endpoints
*   `GET /v1/pnl?user=0x...&builderOnly=true`: Returns Realized/Unrealized PnL, Trade Count, and Taint status.
*   `GET /v1/pnl/breakdown`: Detailed breakdown by coin (ETH, BTC, etc.).

---

## 🧪 Demo & Testing

### Live Demo Flow
1.  Navigate to the **Demo Page** on the frontend.
2.  Enter a Hyperliquid Wallet Address (e.g., `0x...`).
3.  Click **"Verify Trader"**.
4.  Watch the **Live Terminal** verify the connection to Hyperliquid Mainnet.
5.  See the **Verified/Tainted** badge based on builder history.

### Admin Dashboard
*   Access `/dashboard` to view system analytics.
*   Shows real-time request logging, latency stats, and API key management.
*   **Real Data:** All dashboard charts are powered by a custom `request_logs` SQL table.

---

## ⚠️ Limitations & Assumptions

1.  **SQLite**: This project uses SQLite for simplicity and portability (`one-command run`). For high-scale production, `PostgreSQL` is recommended (codebase structure supports switching storage backends easily).
2.  **Rate Limits**: The Hyperliquid Info API has rate limits. We implemented a **concurrency-limited worker pool** (2 workers) to process large account histories without triggering 429s.
3.  **Read-Only**: This application is Read-Only. It does not require a private key and does not execute trades, prioritizing user security.

---

## 📺 Video Demo

*(Link to video demo of endpoints working to be inserted here)*
