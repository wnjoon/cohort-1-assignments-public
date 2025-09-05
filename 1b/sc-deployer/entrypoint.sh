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

# 이전 리포지토리 정리
echo "🧹 Cleaning up previous repository..."
if [ -d "/workspace/cohort-1-assignments-public" ]; then
    rm -rf /workspace/cohort-1-assignments-public
fi

cd /workspace

echo "📥 Cloning repository..."
git clone https://github.com/9oelm/cohort-1-assignments-public.git
cd cohort-1-assignments-public/1a

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
    --broadcast \
    --json 2>&1)

echo "✅ Deployment transaction sent!"
echo ""

# --- 여기가 새로운 로직입니다 ---
echo "📝 Finding broadcast artifact file and extracting addresses..."

# 1. forge script 출력의 마지막 줄에서 "transactions" 파일 경로를 추출합니다.
#    grep으로 transactions 키가 있는 줄을 찾고, jq로 그 값을 뽑아냅니다.
BROADCAST_FILE_PATH=$(echo "$DEPLOYMENT_RESULT" | grep '"transactions"' | jq -r '.transactions')

# 2. 추출한 경로의 파일을 읽어서 계약 주소를 추출합니다.
#    'cat $BROADCAST_FILE_PATH | jq ...'는 해당 파일을 읽어 jq로 전달하라는 의미입니다.
MINI_AMM_ADDRESS=$(cat $BROADCAST_FILE_PATH | jq -r '.transactions[] | select(.contractName == "MiniAMM") | .contractAddress')
MOCK_ERC_0_ADDRESS=$(cat $BROADCAST_FILE_PATH | jq -r '[.transactions[] | select(.contractName == "MockERC20") | .contractAddress][0]')
MOCK_ERC_1_ADDRESS=$(cat $BROADCAST_FILE_PATH | jq -r '[.transactions[] | select(.contractName == "MockERC20") | .contractAddress][1]')

# ... (스크립트 하단은 동일: 주소 출력, deployment.json 생성) ...

# 추출된 주소들을 화면에 출력
echo "📊 Extracted Contract Addresses from $BROADCAST_FILE_PATH:"
echo "  - MockERC20 (Token 0): $MOCK_ERC_0_ADDRESS"
echo "  - MockERC20 (Token 1): $MOCK_ERC_1_ADDRESS"
echo "  - MiniAMM            : $MINI_AMM_ADDRESS"
echo ""

# 추출된 주소들로 deployment.json 파일 생성
cat << EOF > /workspace/deployment.json
{
    "mock_erc_0": "$MOCK_ERC_0_ADDRESS",
    "mock_erc_1": "$MOCK_ERC_1_ADDRESS",
    "mini_amm": "$MINI_AMM_ADDRESS"
}
EOF

echo "✅ deployment.json file created successfully at /workspace/deployment.json"
echo ""
echo "🎉 All done!"

# Clean up and clone repository fresh
echo "🧹 Cleaning up repository..."
rm -rf /workspace/cohort-1-assignments-public
