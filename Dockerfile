FROM node:20-alpine

# Install system dependencies if needed
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source files
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies to reduce image size (optional)
RUN npm prune --production

# Create directory for database
RUN mkdir -p /app/prisma/data

# Set environment to production
ENV NODE_ENV=production

# Expose port if needed (uncomment if your app uses a port)
# EXPOSE 3000

# Run migrations and start app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]