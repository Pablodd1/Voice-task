FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all files
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 10000

# Start the application
CMD ["npm", "start"]