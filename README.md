# This README.md is for developpers. Please check [jendeley-backend/README.md](jendeley-backend/README.md) if you are user.

## How to build and test
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
npm run scan_test_pdfs_and_launch
```

## On `fp-ts`
Although `jendeley` is using [fp-ts](https://gcanti.github.io/fp-ts/) now, I don't want to do functional programming in TypeScript. I just want to use `Either` type. So, I don't use difficult feature of functional programming such as monad in `jendeley`.
