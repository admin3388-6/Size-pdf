FROM node:20-bullseye

# تثبيت Ghostscript
RUN apt-get update && apt-get install -y ghostscript

WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node","server.js"]
