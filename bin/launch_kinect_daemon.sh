SCRIPT_NAME=$(basename $0)
DIR_NAME=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

source "$DIR_NAME/env.sh"
# load the correct version of npm
# . "$NVM_DIR/nvm.sh" && nvm use "$NODE_VERSION_KINECT_DAEMON"

# launch the kinect daemon
exec "$NVM_DIR/v0.10.25/bin/node" "$DIR_NAME/../installation/kinect-daemon/server.js"