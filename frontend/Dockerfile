# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# We need to build with the production API URL, this can be passed as an ARG later,
# for now we'll rely on relative paths or Nginx proxy if needed.
# Since it's a SPA and hits a backend on another port, typically we set VITE_API_URL at build time.
# We'll use a placeholder or assume it's passed via docker-compose build args.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production stage
FROM nginx:alpine
# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
