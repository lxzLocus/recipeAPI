FROM node:18.20-alpine

WORKDIR /app

COPY . .

RUN apk update && apk add --no-cache git
RUN apk add sudo
RUN sudo git config --system core.longpaths true

RUN npm install

CMD ["node", "app.js"]