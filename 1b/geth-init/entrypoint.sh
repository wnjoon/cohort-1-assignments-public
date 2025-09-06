#!/bin/sh

LOCALGETHHOST="geth"
# LOCALGETHHOST="geth"


apk update && apk add curl

until curl -s http://$LOCALGETHHOST:8545 >/dev/null; do
  echo "Waiting for geth JSON-RPC to respond..."
  sleep 0.5
done

echo "Geth JSON-RPC is responding!"

geth attach --exec 'loadScript("/scripts/prefund.js")' http://$LOCALGETHHOST:8545

echo "Finished prefunding the account."

touch /shared/geth-init-complete