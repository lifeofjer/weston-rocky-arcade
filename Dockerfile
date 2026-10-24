FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY . .
ENV PORT=8080
ENV ARCADE_BUILD=play2
EXPOSE 8080
CMD ["node", "server/index.mjs"]
