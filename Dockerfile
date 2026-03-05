FROM node:20-alpine

WORKDIR /app

# Copy package config and install dependencies
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose Vite's default dev port
EXPOSE 3000

# Start development server binding to 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
