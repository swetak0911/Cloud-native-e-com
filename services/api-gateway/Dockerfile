# services/api-gateway/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx tsc
EXPOSE 8080
CMD ["node", "dist/index.js"]
