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
![image](https://user-images.githubusercontent.com/3770618/206854796-142b6b89-126c-4045-934b-5f9ab1eb6f72.png)


## Check performance related issues
```
cd jendeley-backend
npm run gen_dummy_and_serve
cd jendeley-frontend
npm run start
```
