# Stage 1: Build the React frontend
FROM node:20-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Build the Python backend and serve
FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Expose port (Cloud Run sets PORT env var)
ENV PORT=8080
EXPOSE $PORT

# Run gunicorn
WORKDIR /app/backend
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app
