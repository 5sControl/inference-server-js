FROM node:20
WORKDIR /var/www/5scontrol
COPY package.json .
RUN npm i
COPY . .
EXPOSE 9999
ENTRYPOINT ["node", "server.js"]