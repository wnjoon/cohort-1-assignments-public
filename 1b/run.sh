#!/bin/bash

echo "run docker containers"
docker compose up -d

sleep 10

echo "rpc call to get block number"
curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545

echo "check pre-funded address has expected balance"
echo "address is defined in geth-init/prefund.js"
cast balance 0x404fa3f0Acf620e3d2A3c6aa80E27b07C830EB5a --rpc-url http://localhost:8545