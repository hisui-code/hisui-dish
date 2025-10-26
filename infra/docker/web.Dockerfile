FROM node:22-alpine
WORKDIR /app

# 必要パッケージ
RUN apk add --no-cache git

# パッケージとソース（必要に応じて調整）
COPY package*.json ./
RUN npm ci
COPY . .

CMD ["npm", "run", "dev"]