# All-in-One Dockerfile - Next.js with Deployment Service
# Single container with everything pre-configured
# Perfect for simple deployments to any Docker hosting platform

FROM node:20-alpine

# Install git (needed for deployment service to clone repos)
RUN apk add --no-cache git

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install --production

# Copy all source code
COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Create deployment directories
RUN mkdir -p /app/dist /app/temp

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start Next.js
CMD ["npm", "start"]
