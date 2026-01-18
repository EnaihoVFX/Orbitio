#!/bin/bash

# Configuration
BASE_URL="http://localhost:8000"
USER_ADDR="0xUserAddress456" # Arbitrary test address
API_KEY=$1

# Check if Key provided
if [ -z "$API_KEY" ]; then
  echo "❌ Error: API Key required."
  echo "Usage: ./test_api_key.sh <pk_YOUR_API_KEY>"
  echo ""
  echo "1. Go to http://localhost:5173/admin"
  echo "2. Generate a new API Key"
  echo "3. Run this script with the key"
  exit 1
fi

echo "🚀 Testing Builder Token Flow with Key: $API_KEY"
echo ""

# 1. Test PnL Endpoint (Builder Verified)
echo "📡 Requesting PnL (Builder Verified)..."
echo "GET $BASE_URL/v1/pnl?user=$USER_ADDR&builderOnly=true"

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/v1/pnl?user=$USER_ADDR&builderOnly=true" \
  -H "X-API-Key: $API_KEY")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Success (200 OK)"
  echo "Response: $BODY"
  
  # Check for taint status in response
  if echo "$BODY" | grep -q "tainted"; then
      echo "🛡️  Taint Status verified in response."
  fi
else
  echo "❌ Failed ($HTTP_CODE)"
  echo "Response: $BODY"
fi

echo ""
echo "✨ Test Complete."
