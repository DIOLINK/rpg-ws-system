FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

ENV MONGODB_URI=mongodb://mongo:27017/rpg-ws-system
ENV PORT=5001
ENV FRONTEND_URL=http://localhost

EXPOSE 5001

CMD ["node", "src/index.js"]
