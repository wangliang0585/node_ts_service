FROM mcr.microsoft.com/mirror/docker/library/node:18 as builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

RUN npm install --only=production && \
    npm run build

EXPOSE 80

ENTRYPOINT ["npm", "run", "start"]