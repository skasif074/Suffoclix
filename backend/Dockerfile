FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p uploads/movies uploads/series uploads/thumbnails uploads/temp

EXPOSE 5000

CMD ["node", "src/app.js"]