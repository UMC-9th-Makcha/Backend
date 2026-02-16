# Base Image
FROM node:18-alpine

#Timezone 설정
RUN apk add --no-cache tzdata

# Working Directory
WORKDIR /app


# Install Dependencies
COPY package*.json ./
RUN npm ci --omit=dev --no-progress

# Copy Source Code
COPY . .

# 프리즈마 클라이언트 생성
RUN npx prisma generate

# Expose Port
EXPOSE 3000

# Start Server
CMD ["npm", "run", "start"]
