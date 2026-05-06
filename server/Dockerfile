# Stage 1: Install dependencies only
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
# npm ci is faster & more deterministic than npm install
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

# Stage 2: Lean production runtime
FROM node:20-slim AS production
WORKDIR /app
ENV NODE_ENV=production
# Copy only the installed dependencies (no build tools or npm cache)
COPY --from=deps /app/node_modules ./node_modules
# Copy your app source
COPY . .
EXPOSE 3000
CMD ["npm", "start"]