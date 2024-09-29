## How to build and launch with dummy PDFs
First, you must clone this repository.
```
git clone https://github.com/akawashiro/jendeley.git
cd jendeley
```

Build frontend
```
cd jendeley-frontend
npm run build
cp -r ./build ../jendeley-backend/built-frontend
```

[!NOTE]
When your machines which the browser running and the backend server running are different, you must change the `VITE_API_URL` in `jendeley-frontend/.env.development` to the backend server's URL. For example, `VITE_API_URL=http://192.168.11.70:5001`.

Run backend server
```
cd jendeley-backend
npm run scan_test_pdfs_and_launch
```

## CI
All CI are constructed using Dockerfile. You can run CIs on GitHub locally with `sudo docker build .` and `sudo docker . -f Releasable.Dockerfile`. When builds succeeds, you change can be merged.

## Install locally
Use `local-install.sh` on Linux or MacOS, `local-install.bat` on Windows.

## About path representaion
To make the database cross platform, the database must not include "/" or "\" in path fields. To accomplish this, we handle paths always as `string[]` instead of just `string`.

## Environment
I am checking `jendeley` on Linux and Windows.

Linux is the following.
```
> cat /etc/lsb-release
DISTRIB_ID=Ubuntu
DISTRIB_RELEASE=22.04
DISTRIB_CODENAME=jammy
DISTRIB_DESCRIPTION="Ubuntu 22.04.1 LTS"
> uname -a
Linux goshun 5.15.0-58-generic #64-Ubuntu SMP Thu Jan 5 11:43:13 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux
> node --version
v18.13.0
```

Windows is the following.
```
> node --version
v19.3.0
```

## Versioning
We adopt [semantic versioning](https://semver.org/) for `jendeley`.

> Given a version number MAJOR.MINOR.PATCH, increment the:
> - MAJOR version when you make incompatible API changes
> - MINOR version when you add functionality in a backwards compatible manner
> - PATCH version when you make backwards compatible bug fixes
