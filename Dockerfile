# Use the official Node.js long-term support (LTS) image
FROM node:20-alpine

# Create and set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
# Back4app uses the PORT environment variable, so this is primarily for documentation
EXPOSE 5005

# Start the application
CMD ["npm", "start"]
