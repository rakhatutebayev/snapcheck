#!/bin/bash
cd /Users/rakhat/Documents/webhosting/SlideConfirm
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
