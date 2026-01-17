FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy app source
COPY . .

# Build the app (Vite)
RUN npm run build

# Expose port
EXPOSE 4173

# Serve the app using vite preview (lightweight production server)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
