
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test(name, method, endpoint, data=None, headers=None):
    print(f"Testing {name} ({method} {endpoint})...")
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            if headers:
                resp = requests.get(url, headers=headers)
            else:
                resp = requests.get(url)
        elif method == "POST":
            resp = requests.post(url, json=data, headers=headers)
        
        print(f"Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Response: {resp.text}")
        else:
            print("OK")
        return resp
    except Exception as e:
        print(f"FAILED: {e}")
        return None

# 1. Health
test("Health", "GET", "/health")

# 2. Login
login_data = {"email": "debug_final@example.com", "password": "Password123!"}
resp = test("Login", "POST", "/auth/login", login_data)

token = None
if resp and resp.status_code == 200:
    token = resp.json().get("access_token")
    print(f"Got token: {token[:10]}...")

# 3. PnL (Demo)
test("PnL Demo", "GET", "/v1/pnl?user=0x123&builderOnly=true")

# 4. Admin Keys (Needs Token)
if token:
    test("Admin Keys", "GET", "/admin/keys", headers={"Authorization": f"Bearer {token}"})
else:
    print("Skipping Admin Keys test due to login failure")
