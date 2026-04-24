# Stage 1: Build frontend and install backend dependencies
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Frontend: install and build
# Note: Using VITE_API_URL=/api so it uses the same origin
COPY frontend/package.json frontend/package.json
COPY frontend/package-lock.json frontend/package-lock.json
RUN npm --prefix frontend install --legacy-peer-deps
COPY frontend frontend
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm --prefix frontend run build

# Backend: install dependencies
COPY backend/package.json backend/package.json
COPY backend/package-lock.json backend/package-lock.json
RUN npm --prefix backend ci --omit=dev
COPY backend backend

# Stage 2: Final runtime image
FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

# Copy backend and frontend build
COPY --from=builder /app/backend /app/backend
COPY --from=builder /app/frontend/dist /app/frontend/dist

# Expose backend port
EXPOSE 5000

# Start backend (which now also serves the frontend)
CMD ["node", "backend/src/app.js"]
