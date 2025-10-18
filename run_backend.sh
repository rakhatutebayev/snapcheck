#!/bin/bash
cd /Users/rakhat/Documents/webhosting/SlideConfirm
python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
