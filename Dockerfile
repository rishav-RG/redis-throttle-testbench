# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory for the entire application
WORKDIR /app

# Copy package.json and package-lock.json from the root
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy backend and frontend folders into the container
COPY backend ./backend
COPY frontend ./frontend

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run your application
CMD ["npm", "start"]