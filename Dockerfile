# Base Image
FROM node:18-alpine

# Working Directory
WORKDIR /app


# Install Dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy Source Code
COPY . .

# Expose Port
EXPOSE 3000

# Start Server
CMD ["npm", "run", "start"]
