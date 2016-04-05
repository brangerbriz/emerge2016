#!/bin/bash

SCRIPT_NAME=$(basename $0)
DIR_NAME=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

function prepend_timestamp() {
	awk '{ print strftime("%Y-%m-%d %H:%M:%S |"), $0; fflush(); }'
}

source "$DIR_NAME/env.sh"
# load the correct version of npm
. "$NVM_DIR/nvm.sh" && nvm use "$NODE_VERSION_KINECT_DAEMON"

# launch the kinect daemon w/ logging
(node "$DIR_NAME/../installation/kinect-daemon/server.js" 2>&1 & KINECT_DAEMON_PID="$!") \
	| prepend_timestamp \
	| tee -a "$DIR_NAME/../log/kinect-daemon.log" &

# launch mongod
("$DIR_NAME/start_mongod_master.sh" 2>&1 & MONGOD_MASTER_PID="$!")\
	| tee -a "$DIR_NAME/../log/mongod-master.log" &

# reverse-ssh tunnel to gallery server
("$DIR_NAME/tunnel.sh" 2>&1 & SSH_TUNNEL_PID="$!") \
	| prepend_timestamp \
	| tee -a "$DIR_NAME/../log/tunnel.log" & 

# sync thumbnail folders on installation and microsite server
lsyncd "$DIR_NAME/lsyncd.config.lua"

# launch installation
( cd "$DIR_NAME/../installation/" && "./node_modules/nw/bin/nw" )