FROM node:18

COPY . /jendeley
WORKDIR /jendeley/jendeley-backend
RUN npm install
RUN npm run build
RUN npm run test
WORKDIR /jendeley/jendeley-frontend
RUN npm install
RUN npm run build
