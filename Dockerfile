FROM node:22-slim

# Install fonts + fontconfig so canvas can render text
RUN apt-get update && apt-get install -y \
  fontconfig \
  fonts-dejavu-core \
  fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

CMD ["npm", "start"]
