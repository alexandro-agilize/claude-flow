FROM node:20-alpine AS backend-deps
WORKDIR /app
COPY package*.json ./
RUN npm install --ignore-scripts && npx prisma generate

FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=backend-deps /app/node_modules ./node_modules
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY . .
RUN mkdir -p queue db

EXPOSE 3000
CMD ["node", "server/index.js"]
