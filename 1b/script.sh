#!/bin/bash

OPTION=$1

# BLOCKSCOUT_PATH=blockscout/docker-compose
BLOCKSCOUT_PATH=blockscout
GRAPHQL_PATH=graph

function geth_up() {
    echo "==> up geth, caddy, ngrok and deploy smart contract"
    docker-compose -f docker-compose.yml --project-name 1b up -d
}

function graphql_up() {
    echo "==> up graphql"
    docker-compose -f $GRAPHQL_PATH/docker-compose.yml --project-name 1b up -d
}

function blockscout_up() {
    echo "==> up blockscout"
    # docker-compose -f $BLOCKSCOUT_PATH/geth.yml --project-name 1b up -d
    docker-compose -f $BLOCKSCOUT_PATH/docker-compose.yml --project-name 1b up -d
}

function geth_down() {
    echo "==> down geth, caddy, ngrok and deploy smart contract"
    docker-compose -f docker-compose.yml --project-name 1b down -v
}

function graphql_down() {
    echo "==> down graphql"
    docker-compose -f $GRAPHQL_PATH/docker-compose.yml --project-name 1b down -v
}

function blockscout_down() {
    echo "==> down blockscout"
    # docker-compose -f $BLOCKSCOUT_PATH/geth.yml --project-name 1b down -v
    # rm -rf $BLOCKSCOUT_PATH/services/blockscout-db-data
    docker-compose -f $BLOCKSCOUT_PATH/docker-compose.yml --project-name 1b down -v
    rm -rf $BLOCKSCOUT_PATH/services/blockscout-db-data
}

function geth_restart() {
    echo "==> restart geth, caddy, ngrok and deploy smart contract"
    docker-compose -f docker-compose.yml --project-name 1b restart
}

function graphql_restart() {
    echo "==> restart graphql"
    docker-compose -f $GRAPHQL_PATH/docker-compose.yml --project-name 1b restart
}

function blockscout_restart() {
    echo "==> restart blockscout"
    # docker-compose -f $BLOCKSCOUT_PATH/geth.yml --project-name 1b restart
    docker-compose -f $BLOCKSCOUT_PATH/docker-compose.yml --project-name 1b restart
}


if [ "$OPTION" == "down" ]; then
    blockscout_down
    graphql_down
    geth_down
    exit 0
elif [ "$OPTION" == "up" ]; then
    geth_up
    graphql_up
    blockscout_up
    exit 0
elif [ "$OPTION" == "restart" ]; then
    geth_restart
    graphql_restart
    blockscout_restart
    exit 0
else
    echo "Usage: $0 {up|down|restart}"
    exit 1
fi
