FROM node:20-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Cloud Run injects PORT environment variable (defaults to 8080 or 3000)
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
