FROM node:18

COPY . /jendeley

WORKDIR /jendeley
RUN diff /jendeley/jendeley-backend/src/api_schema.ts /jendeley/jendeley-frontend/src/api_schema.ts

WORKDIR /jendeley/jendeley-backend
RUN ./check-version.sh
RUN npm install
RUN npm run check:prettier
RUN npm run build
RUN npm run test
RUN npm run scan_test_pdfs
RUN [ -f "edit_and_run.sh" ] && exit 1 || echo "Build DB succeeded"

WORKDIR /jendeley/jendeley-frontend
RUN npm install
RUN npm run check:prettier
RUN npm run build
RUN npm run jest
