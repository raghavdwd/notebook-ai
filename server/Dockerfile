FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]