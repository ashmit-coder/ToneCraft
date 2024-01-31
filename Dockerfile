FROM node:alpine
RUN apk update
WORKDIR /ToneCraft
COPY package.json /ToneCraft
RUN npm install
COPY . /ToneCraft
EXPOSE 5000
CMD ["npm", "start"]
