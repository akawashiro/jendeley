cd .\jendeley-frontend
call npm install
call npm run build
cd ..

xcopy /E/H/Y .\jendeley-frontend\build .\jendeley-backend\built-frontend\

cd .\jendeley-backend
call npm install
call npm run build
call npm install . -g
