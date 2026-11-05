import os
import sqlite3
import threading
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Cổng Đăng Ký Ngày Hội Việc Làm")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.getenv("DB_PATH", "ngayhoi.db")
db = sqlite3.connect(DB_PATH, check_same_thread=False)
db.execute("""CREATE TABLE IF NOT EXISTS dang_ky(
  ma_sv TEXT, ma_phien TEXT, UNIQUE(ma_sv, ma_phien))""")

lock = threading.Lock()

class DangKy(BaseModel):
    ma_sv: str
    ma_phien: str

@app.post("/api/dang-ky", status_code=201)
def dang_ky(d: DangKy):
    # 1. Kiểm tra sinh viên đã đăng ký phiên này chưa
    with lock:
        cur_check = db.execute("SELECT 1 FROM dang_ky WHERE ma_sv = ? AND ma_phien = ?", (d.ma_sv, d.ma_phien))
        if cur_check.fetchone():
            raise HTTPException(status_code=409, detail="DA_DANG_KY")

    # 2. Gộp đếm và ghi vào một câu lệnh nguyên tử
    with lock:
        cur = db.execute("""
            INSERT INTO dang_ky (ma_sv, ma_phien)
            SELECT ?, ?
            WHERE (SELECT COUNT(*) FROM dang_ky WHERE ma_phien = ?) < 30
        """, (d.ma_sv, d.ma_phien, d.ma_phien))
        db.commit()

        if cur.rowcount == 0:
            raise HTTPException(status_code=409, detail="HET_CHO")

    return {"ok": True}
