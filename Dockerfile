FROM node:20.18.0 as build
WORKDIR /usr/src/app

COPY . .
RUN yarn install --immutable

RUN yarn build

FROM node:20.18.0 as production

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/dist dist

EXPOSE 3000

ENTRYPOINT ["node", "dist/backend/index.cjs"]