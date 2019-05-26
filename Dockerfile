FROM node:10.14.1

# upto date apt list
RUN apt-get update \
# install packages
  && apt-get install -y --no-install-recommends \
    locales \
# clean it
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# set up locales
RUN sed -i 's/^# *\(en_US.UTF-8\)/\1/' /etc/locale.gen \
  && locale-gen \
  && update-locale LC_ALL=en_US.utf8

# load locale before entring bash
ENV LANG en_US.UTF-8

# init app and cd into working dir
WORKDIR /usr/src/app

# bundle app source
COPY . .

# install npm dependencies
RUN npm install \
# build node project
  && npm run build \
# prune devDependencies via --production flag
  && npm prune --production

# re-installs package - web3
# web3 looses ref to one of it's dependencies post pruning - typedarray-to-buffer
# this is a known bug - https://github.com/ethereum/web3.js/issues/1914
RUN npm uninstall web3 && npm i --save-exact web3@1.0.0-beta.37
