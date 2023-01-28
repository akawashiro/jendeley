# jendeley
`jendeley` is a JSON-based PDF paper organizing software.
- `jendeley` is JSON-based. You can see and edit your database easily.
- `jendeley` is working locally. Your important database is owned only by you. Not cloud.
- `jendeley` is browser based. You can run it anywhere node.js runs.

## Quickstart
```
npm install @a_kawashiro/jendeley -g
jendeley scan --papers_dir <YOUR PDFs DIR>
jendeley launch --db <YOUR PDFs DIR>/jendeley_db.json
```
Then you can see a screen like this!
![image](https://user-images.githubusercontent.com/3770618/209427855-374e6523-8910-4c98-a9ec-05bd62ae9b8e.png)

Please check [user document](https://akawashiro.github.io/jendeley/) for more details.

# For developpers
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