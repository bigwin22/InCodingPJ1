# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Build arguments for environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_KEY

# Set environment variables for Vite to pick up during build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_KEY=$VITE_SUPABASE_KEY

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application with environment variables
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4892

CMD ["nginx", "-g", "daemon off;"]
