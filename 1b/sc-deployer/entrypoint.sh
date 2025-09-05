#!/bin/sh

set -e

echo "🚀 Starting smart contract deployment..."

# Wait for geth-init to complete prefunding
echo "⏳ Waiting for geth-init to complete prefunding..."
until [ -f "/shared/geth-init-complete" ]; do
  echo "Waiting for geth-init-complete file..."
  sleep 1
done
echo "✅ Prefunding completed, proceeding with deployment..."

# Clean up and clone repository fresh
echo "🧹 Cleaning up previous repository..."
if [ -d "/workspace/cohort-1-assignments-public" ]; then
    rm -rf /workspace/cohort-1-assignments-public
fi

cd /workspace

echo "📥 Cloning repository..."
git clone https://github.com/9oelm/cohort-1-assignments-public.git
cd cohort-1-assignments-public

# Navigate to the 1a directory
cd 1a

# Install dependencies
echo "📦 Installing dependencies..."
forge install

# Build the project
echo "🔨 Building project..."
forge build

# Deploy the contracts
echo "🚀 Deploying MiniAMM contracts..."
# forge script script/MiniAMM.s.sol:MiniAMMScript \
#     --rpc-url http://geth:8545 \
#     --private-key be44593f36ac74d23ed0e80569b672ac08fa963ede14b63a967d92739b0c8659 \
#     --broadcast

# echo "✅ Deployment completed!"
# echo ""
# echo "📊 Contract addresses should be available in the broadcast logs above."

# # Clean up and clone repository fresh
# echo "🧹 Cleaning up repository..."
# rm -rf /workspace/cohort-1-assignments-public


# # Extract contract addresses to deployment.json
# echo "📝 Extracting contract addresses..."
# cd /workspace
# node extract-addresses.js

# echo "✅ All done! Check deployment.json for contract addresses."

DEPLOYMENT_RESULT=$(forge script script/MiniAMM.s.sol:MiniAMMScript \
    --rpc-url http://geth:8545 \
    --private-key be44593f36ac74d23ed0e80569b672ac08fa963ede14b63a967d92739b0c8659 \
    --broadcast \
    --json 2>&1)

echo "$DEPLOYMENT_RESULT"

echo ""
echo "✅ Deployment completed!"
echo ""

# Parse and display contract addresses from JSON output
echo "📊 Deployed Contract Addresses:"
echo "$DEPLOYMENT_RESULT" | grep -o '"contract_address":"0x[a-fA-F0-9]*"' | \
while read -r line; do
    address=$(echo "$line" | sed 's/"contract_address":"//g' | sed 's/"//g')
    if [ "$address" != "null" ] && [ -n "$address" ]; then
        echo "  📍 Contract: $address"
    fi
done