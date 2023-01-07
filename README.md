# This README.md is for developers. Please check [jendeley-backend/README.md](jendeley-backend/README.md) if you are user.

## How to build and launch with dummy PDFs
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

## CI
All CI are constructed using Dockerfile. You can run CIs on GitHub locally with `sudo docker build .` and `sudo docker . -f Releasable.Dockerfile`. When builds succeeds, you change can be merged.

## Install locally
Use `local-install.sh` on Linux or MacOS, `local-install.bat` on Windows.

## About `fp-ts`
Although `jendeley` is using [fp-ts](https://gcanti.github.io/fp-ts/) now, I don't want to do functional programming in TypeScript. I just want to use `Either` type. So, I don't use difficult feature of functional programming such as monad in `jendeley`.

## About path
To make the database cross platform, the database must not include "/" or "\" in path fields. To accomplish this, we handle paths always as `string[]` instead of just `string`.
