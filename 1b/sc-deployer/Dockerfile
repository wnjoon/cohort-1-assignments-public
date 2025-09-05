# 1. 베이스 이미지 지정
# 기존에 사용하던 공식 foundry 이미지를 기반으로 시작합니다.
FROM ghcr.io/foundry-rs/foundry:latest

# 2. 패키지 설치를 위해 root 사용자로 전환
USER root

# 3. apt 패키지 목록을 업데이트하고 jq를 설치합니다.
RUN apt-get update && apt-get install -y jq \
    && rm -rf /var/lib/apt/lists/*

# 4. 보안을 위해 다시 기본 사용자인 foundry로 전환
USER foundry