FROM node:20-bullseye

# تثبيت Ghostscript
RUN apt-get update && apt-get install -y ghostscript

# تحديث npm
RUN npm install -g npm@11.6.4

WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node","server.js"]