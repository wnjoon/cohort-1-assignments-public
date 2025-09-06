#!/bin/bash

BLOCKSCOUTPATH=blockscout/docker-compose
docker-compose -f $BLOCKSCOUTPATH/geth.yml up -d
