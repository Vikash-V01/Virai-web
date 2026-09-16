FROM node:20-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Cloud Run default port is 8080; AI Studio proxy uses 3000
ENV PORT=8080
EXPOSE 8080
EXPOSE 3000

CMD ["npm", "start"]
