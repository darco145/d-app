FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=deps /app ./

EXPOSE 3000

CMD ["node", "server.js"]
