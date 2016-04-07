#!/bin/bash

SCRIPT_NAME=$(basename $0)
DIR_NAME=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

source "$DIR_NAME/env.sh"
mongod \
	--dbpath "$DIR_NAME/../data/db/" \
	--port "$MONGOD_PORT" \
	--master & echo $! > "$DIR_NAME/../pid/mongod-master.pid"
