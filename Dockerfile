FROM debian:stretch
LABEL maintainer="bdorsey@brangerbriz.com"

# general update and upgrade
RUN apt-get update && \
    apt-get -y upgrade && \
    apt-get install -y gnupg curl git
# install Node.js & NPM
# https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs && \
    apt-get -y autoremove

RUN useradd -d /home/debian -ms /bin/bash debian
RUN chown -R debian:debian /home/debian
USER debian

# copy the ethereum folder to the home directory
ADD --chown=debian:debian ./ /home/debian/emerge2016
WORKDIR /home/debian/emerge2016/data
RUN curl -o thumbnails.tar.gz -L \
    https://github.com/brangerbriz/emerge2016/releases/download/v1.0/thumbnails.tar.gz
RUN tar xzf thumbnails.tar.gz

WORKDIR /home/debian/emerge2016/microsite
RUN git checkout emerge-docker
RUN npm install

CMD sleep 10 && node server