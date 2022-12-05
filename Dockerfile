FROM node:18

COPY . /jendeley
WORKDIR /jendeley/jendeley-backend
RUN npm install
RUN npm run build
WORKDIR /jendeley/jendeley-frontend
RUN npm install
