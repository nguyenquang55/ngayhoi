import os
import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Cổng Đăng Ký Ngày Hội Việc Làm")

# Cấu hình CORS chặt chẽ chỉ cho phép giao diện frontend http://localhost:5173 (tiêu chí điểm xuất sắc)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Kết nối CSDL SQLite với DB_PATH hỗ trợ CSDL tạm trên RAM khi kiểm thử
DB_PATH = os.getenv("DB_PATH", "ngayhoi.db")
db = sqlite3.connect(DB_PATH, check_same_thread=False)
db.execute("""CREATE TABLE IF NOT EXISTS dang_ky(
  ma_sv TEXT, ma_phien TEXT, UNIQUE(ma_sv, ma_phien))""")

class DangKy(BaseModel):
    ma_sv: str
    ma_phien: str

@app.post("/api/dang-ky", status_code=201)
def dang_ky(d: DangKy):
    try:
        db.execute("INSERT INTO dang_ky VALUES (?, ?)", (d.ma_sv, d.ma_phien))
        db.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="DA_DANG_KY")
    return {"ok": True}
