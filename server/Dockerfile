FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY sql ./sql
RUN npm run build
ENV NODE_ENV=production
EXPOSE 4020
CMD ["node", "dist/index.js"]
