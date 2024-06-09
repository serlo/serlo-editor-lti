# TODO: when this repo build first the src code, change to only run dist folders

FROM node:20.13-alpine
WORKDIR /app

COPY tsconfig.json tsconfig.node.json \
    vite.config.ts index.html \
    package.json yarn.lock ./
COPY src src
RUN yarn --immutable --immutable-cache --silent
RUN yarn build

EXPOSE 3000
ENTRYPOINT ["yarn", "start"]