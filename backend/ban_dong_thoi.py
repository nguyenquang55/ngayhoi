import sys, httpx
from concurrent.futures import ThreadPoolExecutor

URL = "http://localhost:8000/api/dang-ky"
PHIEN = sys.argv[1]  # mỗi lần chạy một phiên mới: P09, P10, ...

def gui(i):
    r = httpx.post(URL, json={"ma_sv": f"TN{i:03}", "ma_phien": PHIEN}, timeout=30.0)
    return r.status_code

with ThreadPoolExecutor(max_workers=40) as ex:
    ma = list(ex.map(gui, range(40)))

print("201:", ma.count(201), "· 409:", ma.count(409))
