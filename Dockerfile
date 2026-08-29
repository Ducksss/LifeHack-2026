FROM node:22-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

ENV NODE_ENV=production PORT=8787 MISSIONCART_DB=/app/data/missioncart.db
EXPOSE 8787
VOLUME ["/app/data"]
CMD ["npm", "start"]
