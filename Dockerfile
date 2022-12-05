FROM node:18

COPY . /jendeley

WORKDIR /jendeley/jendeley-backend
RUN npm install
RUN npm run build
RUN npm run test
RUN npm run test_gen_test_pdfs
RUN [ -f "edit_and_run.sh" ] && exit 1 || echo "Build DB succeeded"

WORKDIR /jendeley/jendeley-frontend
RUN npm install
RUN npm run build
