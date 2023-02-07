FROM node:18.14.0@sha256:0d8bf0e743a752d8d01e9ff8aba21ac15a0ad1a3d2a2b8df90764d427618c791

WORKDIR /opt/nip06-cli

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsup.config.ts ./
COPY ./src/ ./src/

RUN npm run build && rm -rf src

COPY entrypoint.sh ./

ENTRYPOINT [ "sh", "./entrypoint.sh" ]
