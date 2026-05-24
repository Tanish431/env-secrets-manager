FROM node:22-alpine

RUN apk add --no-cache postgresql-client

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY db ./db

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npm run migrate && npm start"]
