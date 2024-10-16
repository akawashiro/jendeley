FROM node:18

COPY . /jendeley

WORKDIR /jendeley
RUN diff /jendeley/jendeley-backend/src/api_schema.ts /jendeley/jendeley-frontend/src/api_schema.ts
RUN diff /jendeley/jendeley-backend/src/constants.ts /jendeley/jendeley-frontend/src/constants.ts
RUN diff /jendeley/README.md /jendeley/jendeley-backend/README.md
RUN npx markdown-toc -i /jendeley/jendeley-backend/README.md
RUN git diff --exit-code /jendeley/jendeley-backend/README.md

WORKDIR /jendeley/jendeley-backend
RUN ./check-version.sh
RUN npm install
RUN npm run lint
RUN npm run build
RUN npm run test
RUN npm run scan_test_pdfs
RUN [ -f "edit_and_run.sh" ] && cat edit_and_run.sh && exit 1 || echo "Build DB succeeded"
RUN ./scripts/check_update_all_generated_DBs.sh

WORKDIR /jendeley/jendeley-frontend
RUN npm install
RUN npm run lint
RUN npm run build
# RUN npm run jest
