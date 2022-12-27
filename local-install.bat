cd .\jendeley-frontend
call npm run build
cd ..

del /q .\jendeley-backend\built-frontend
copy /y .\jendeley-frontend\build .\jendeley-backend\built-frontend

cd .\jendeley-backend
call npm run build
call npm install . -g