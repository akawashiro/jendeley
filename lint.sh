#! /bin/bash

black *.py
isort *.py
mypy --strict *.py
