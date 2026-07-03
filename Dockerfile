# --- Stage 1: build the React frontend ---
FROM node:20-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# --- Stage 2: server image (serves the API + the built client) ---
FROM node:20-alpine AS server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
# Place the built client where the server expects it (../../client/dist from server/src)
COPY --from=client /app/client/dist /app/client/dist

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
CMD ["node", "src/index.js"]
