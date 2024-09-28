FROM node:18

COPY . /jendeley

WORKDIR /jendeley/jendeley-frontend
RUN npm install
RUN npm run lint
RUN npm run build

WORKDIR /jendeley/jendeley-backend
RUN npm install
RUN npm run lint
RUN npm run build
RUN npm install . -g

RUN jendeley --help
