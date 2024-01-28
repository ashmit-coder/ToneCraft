FROM node:alpine
RUN apk update \
    && apk add --no-cache python3 python3-dev
WORKDIR /ToneCraft
COPY package.json /ToneCraft
RUN npm install
COPY . /ToneCraft
EXPOSE 5000
CMD ["npm", "start"]
