import os
os.environ["DB_PATH"] = ":memory:"  # CSDL tạm, không đụng dữ liệu thật

import pytest
from fastapi.testclient import TestClient
import main

client = TestClient(main.app)

@pytest.fixture(autouse=True)
def so_trong():
    main.db.execute("DELETE FROM dang_ky")
    main.db.commit()

def lap_day(ma_phien, n):
    for i in range(n):
        client.post("/api/dang-ky", json={"ma_sv": f"SV{i:03}", "ma_phien": ma_phien})

# 1. P01 trống -> SV001 đăng ký P01 -> 201
def test_p01_trong_sv001_thanh_cong():
    r = client.post("/api/dang-ky", json={"ma_sv": "SV001", "ma_phien": "P01"})
    assert r.status_code == 201

# 2. P01 có 29 -> SV mới đăng ký P01 -> 201
def test_p01_co_29_sv_moi_thanh_cong():
    lap_day("P01", 29)
    r = client.post("/api/dang-ky", json={"ma_sv": "SV_MOI", "ma_phien": "P01"})
    assert r.status_code == 201

# 3. P01 có 30 -> SV mới đăng ký P01 -> 409 HET_CHO
def test_nguoi_thu_31_bi_tu_choi():
    lap_day("P01", 30)
    r = client.post("/api/dang-ky", json={"ma_sv": "SV_MOI", "ma_phien": "P01"})
    assert r.status_code == 409
    assert r.json().get("detail") == "HET_CHO"

# 4. P01 có 30, gồm SV000 -> SV000 đăng ký lại P01 -> 409 DA_DANG_KY
def test_sv000_dang_ky_lai_bi_trung():
    lap_day("P01", 30)
    r = client.post("/api/dang-ky", json={"ma_sv": "SV000", "ma_phien": "P01"})
    assert r.status_code == 409
    assert r.json().get("detail") == "DA_DANG_KY"

# 5. P01 có 30 -> SV031 đăng ký P02 -> 201
def test_p01_co_30_sv031_dang_ky_p02_thanh_cong():
    lap_day("P01", 30)
    r = client.post("/api/dang-ky", json={"ma_sv": "SV031", "ma_phien": "P02"})
    assert r.status_code == 201
