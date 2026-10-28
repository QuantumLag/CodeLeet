FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./
RUN npm install

FROM base AS frontend-build
ARG NEXT_PUBLIC_API_BASE=http://localhost:5000/api
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
COPY . .
RUN npm run build

FROM base AS frontend
ENV NODE_ENV=production
COPY --from=frontend-build /app/.next ./.next
COPY --from=frontend-build /app/src ./src
COPY --from=frontend-build /app/next.config.mjs ./next.config.mjs
COPY --from=frontend-build /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=frontend-build /app/postcss.config.mjs ./postcss.config.mjs
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0"]

FROM base AS backend-api
ENV NODE_ENV=production
COPY server ./server
EXPOSE 5000
CMD ["npm", "run", "server:start"]

FROM base AS worker
ENV NODE_ENV=production
COPY worker ./worker
CMD ["npm", "run", "worker:start"]

FROM base AS websocket-server
ENV NODE_ENV=production
COPY websocket ./websocket
EXPOSE 5001
CMD ["npm", "run", "websocket:start"]

FROM base AS db-init
ENV NODE_ENV=production
COPY server ./server
CMD ["npm", "run", "db:init"]
