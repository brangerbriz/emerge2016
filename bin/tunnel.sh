#!/bin/bash

SCRIPT_NAME=$(basename $0)
DIR_NAME=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

source "$DIR_NAME/env.sh"

SSH_KEY_ARGS=''
if [ -s "$DIR_NAME/../data/server-key" ] 
then
	SSH_KEY_ARGS="-i $DIR_NAME/../data/server-key"
fi

# NOTE: If connections established with this tunnel are failing
# check the selected answer from this stack post:
# http://serverfault.com/questions/478171/reverse-ssh-tunnel-connexion-refused
ssh \
	-R "0.0.0.0:$SSH_TUNNEL_REMOTE_PORT:127.0.0.1:$MONGOD_PORT" \
	"$SSH_TUNNEL_REMOTE_USER@$REMOTE_SERVER_HOST" \
	$(echo $SSH_KEY_ARGS) \
	-fNT

echo $! # last PID
