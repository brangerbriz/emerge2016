#!/bin/bash

SCRIPT_NAME=$(basename $0)
DIR_NAME=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

function prepend_timestamp() {
	awk '{ print strftime("%Y-%m-%d %H:%M:%S |"), $0; fflush(); }'
}

source "$DIR_NAME/env.sh"
# load the correct version of npm
. "$NVM_DIR/nvm.sh" && nvm use "$NODE_VERSION_KINECT_DAEMON"

