# TODO: app in development mode!!

FROM node:20.13-alpine
WORKDIR /app

COPY . .
COPY .env-template .env
RUN yarn --immutable --immutable-cache --silent
RUN yarn build

ENTRYPOINT ["yarn", "start"]