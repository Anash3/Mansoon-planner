FROM node:20-alpine AS runner

WORKDIR /app

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy codebase
COPY . .

# Build the Next.js application
RUN npm run build

# Expose Next.js server port
EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "run", "start"]
