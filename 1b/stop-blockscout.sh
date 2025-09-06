#!/bin/bash

BLOCKSCOUTPATH=blockscout/docker-compose
docker-compose -f $BLOCKSCOUTPATH/geth.yml down -v

rm -rf $BLOCKSCOUTPATH/services/blockscout-db-data
