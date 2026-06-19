FROM node:22-alpine AS build
WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable && yarn install --immutable

COPY . .
RUN yarn build

FROM node:22-alpine
WORKDIR /app

RUN npm install -g serve@14

COPY --from=build /app/dist ./dist

EXPOSE 5555

CMD ["serve", "-s", "dist", "-l", "5555", "--no-clipboard"]
