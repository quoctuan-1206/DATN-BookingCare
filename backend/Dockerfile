FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code and prisma schema
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
