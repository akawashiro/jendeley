FROM node:18

RUN npm install @a_kawashiro/jendeley -g
COPY ./jendeley-backend/test_pdfs /test_pdfs
RUN jendeley scan --papers_dir /test_pdfs
