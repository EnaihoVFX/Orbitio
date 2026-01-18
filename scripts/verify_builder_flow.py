
import sys
import os
import requests
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.database import Base, User, init_db
from src.config import settings
from src.auth import get_password_hash, create_access_token

# Setup DB Connection
# Ensure data dir exists
db_path = settings.DATABASE_URL.replace("sqlite:///", "")
db_dir = os.path.dirname(db_path)
if db_dir:
    os.makedirs(db_dir, exist_ok=True)

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

BASE_URL = "http://localhost:8000"

def run_verification():
    print("🚀 Starting Builder Token Verification Flow (Bypass Login)...\n")
    
    # 0. Wait for server
    try:
        requests.get(f"{BASE_URL}/health")
    except:
        print("❌ Server not reachable at localhost:8000. Is it running?")
        return

    # 1. Setup User in DB (Direct)
    init_db()
    db = SessionLocal()
    
    timestamp = int(time.time())
    email = f"admin_test_{timestamp}@orbitio.com" # Unique email
    
    print(f"👤 Creating Admin User: {email}...")
    user = User(email=email, hashed_password=get_password_hash("password123"), is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user) # Ensure we have ID and committed
    db.close()
    
    # 2. Generate Token Manually (Using src.auth)
    print("\n🔐 Generating Token Manually...")
    access_token = create_access_token(data={"sub": email})
    headers = {"Authorization": f"Bearer {access_token}"}
    cookies = {"access_token": access_token}
    print("✅ Token generated.")

    # 3. Test Protected Admin Route (Settings)
    print("\n⚙️  Configuring Target Builder (Protected Route)...")
    target_builder = "0xBuilderAddress123"
    
    # Try with headers (Bearer) - src.auth supports both cookie and header fallback
    resp = requests.post(f"{BASE_URL}/admin/settings", json={"key": "TARGET_BUILDER", "value": target_builder}, headers=headers)
    
    if resp.status_code == 200:
        print(f"✅ Target Builder set to: {target_builder}")
        print("   (Server successfully authenticated user from DB!)")
    else:
        print(f"❌ Failed to set config: {resp.status_code} - {resp.text}")
        if resp.status_code == 401:
             print("   CRITICAL: Server cannot find the user in DB, even with manual token.")
        return

    # 4. Generate New API Key
    print("\n🔑 Generating Builder API Key...")
    key_name = f"VerificationKey_{timestamp}"
    resp = requests.post(f"{BASE_URL}/admin/keys", json={"name": key_name}, headers=headers)
    
    if resp.status_code == 200:
        api_key_data = resp.json()
        api_key = api_key_data["key"]
        print(f"✅ Generated API Key: {api_key}")
    else:
        print(f"❌ Failed to generate key: {resp.text}")
        return

    # 5. Test API Access with Key
    print("\n📡 Testing API Access with new Key...")
    test_user_addr = "0xUserAddress456"
    
    # Request WITH Key
    resp = requests.get(
        f"{BASE_URL}/v1/pnl",
        params={"user": test_user_addr, "builderOnly": "true"},
        headers={"X-API-Key": api_key}
    )
    
    if resp.status_code == 200:
        data = resp.json()
        print("   ✅ Success! API returned 200 OK.")
        pnl = data.get('pnl', {})
        print(f"   📊 PnL Stats Received: Realized={pnl.get('realizedPnl')}")
        print(f"   🛡️  Taint Check Ran: {pnl.get('tainted')}")
    else:
        print(f"   ❌ Failed to access API: {resp.status_code} - {resp.text}")

    print("\n✨ Verification Complete.")

if __name__ == "__main__":
    run_verification()
