FROM public.ecr.aws/docker/library/node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
ENV PORT=8080
ENV ARCADE_BUILD=play7
EXPOSE 8080
CMD ["node", "server/index.mjs"]
