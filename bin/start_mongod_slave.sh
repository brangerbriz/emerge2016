#!/bin/bash

# NOTE: tunnel.sh should have already been run from
# the installation machine to establish an ssh-tunnel
# to this cloud server before this script is run.

SCRIPT_NAME=$(basename $0)
DIR_NAME=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

source "$DIR_NAME/env.sh"
mongod \
	--dbpath "$DIR_NAME/../data/db-byob-secondary/" \
	--port "$MONGOD_PORT" \
	--slave \
	--source "127.0.0.1:$SSH_TUNNEL_REMOTE_PORT"
