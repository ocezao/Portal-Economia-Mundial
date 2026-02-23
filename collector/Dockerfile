FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4010

# Start server
CMD ["npm", "start"]
