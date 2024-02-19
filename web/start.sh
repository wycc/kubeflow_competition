#!/bin/bash
while [ 1 ]; do
  echo "Starting web server"
  . /opt/conda/bin/activate pytorch
  cd /server
  python main.py
  sleep 1
done
```