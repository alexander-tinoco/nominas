# Stage 1: Base
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# Stage 2: Development
FROM base AS development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage 3: Production Dependencies
FROM base AS prod-deps
RUN npm ci --only=production

# Stage 4: Production Runtime
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src/ ./src/
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "run", "start"]
