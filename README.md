# jendeley
JSON-based paper organaizing software

## How to use
First, you must clone this repository.
```
git clone https://github.com/akawashiro/jendeley.git
cd jendeley
```

Build frontend
```
cd jendeley-frontend
npm run build # Generated file are copied to jendeley-backend/built-frontend automatically.
```

Run backend server
```
cd jendeley-backend
npm run gen_test_pdfs_and_serve
```


Then you can see a screen like this!
![image](https://user-images.githubusercontent.com/3770618/206180644-f9f6001a-c3aa-41dc-985a-1318e50a5f7b.png)

## Check performance related issues
```
cd jendeley-backend
npm run gen_dummy_and_serve
cd jendeley-frontend
npm run start
```
