#!/bin/sh

# 스크립트 실행 중 오류 발생 시 즉시 중단
set -e

echo "🚀 Starting smart contract deployment..."

# geth-init이 prefunding을 완료하기를 기다림
echo "⏳ Waiting for geth-init to complete prefunding..."
until [ -f "/shared/geth-init-complete" ]; do
  echo "Waiting for geth-init-complete file..."
  sleep 1
done
echo "✅ Prefunding completed, proceeding with deployment..."

# Clean up and clone repository fresh
echo "🧹 Cleaning up previous repository..."
rm -rf /workspace/cohort-1-assignments-public

cd /workspace

echo "📥 Cloning repository..."
git clone https://github.com/9oelm/cohort-1-assignments-public.git
cd cohort-1-assignments-public

# Navigate to the 1a directory
cd 1a

# 의존성 설치
echo "📦 Installing dependencies..."
# apt-get update && apt-get install -y \
#     curl \
#     wget \
#     git \
#     build-essential \
#     ca-certificates \
#     jq \
#     && rm -rf /var/lib/apt/lists/*
forge install

# 프로젝트 빌드
echo "🔨 Building project..."
forge build

# 계약 배포 및 결과를 JSON으로 변수(DEPLOYMENT_RESULT)에 저장
echo "🚀 Deploying MiniAMM contracts and capturing JSON output..."
DEPLOYMENT_RESULT=$(forge script script/MiniAMM.s.sol:MiniAMMScript \
    --rpc-url http://geth:8545 \
    --private-key be44593f36ac74d23ed0e80569b672ac08fa963ede14b63a967d92739b0c8659 \
    --broadcast

echo "✅ Deployment completed!"
echo ""
echo "📊 Contract addresses should be available in the broadcast logs above."

# Extract contract addresses to deployment.json
echo "📝 Extracting contract addresses..."
cd /workspace
node extract-addresses.js

echo "✅ All done! Check deployment.json for contract addresses."
