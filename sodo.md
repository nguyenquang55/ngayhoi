# Sơ Đồ Kiến Trúc & Luồng Hoạt Động Cổng Đăng Ký Ngày Hội Việc Làm

## 1. Sơ đồ Kiến trúc Hệ thống (Architecture Diagram)

```mermaid
flowchart LR
    subgraph Client["Trình duyệt (Client)"]
        UI["Giao diện React (Vite)\nhttp://localhost:5173"]
    end

    subgraph Server["Máy chủ Backend"]
        CORS["Bộ lọc CORS\n(allow_origins: localhost:5173)"]
        FastAPI["FastAPI App\nPOST /api/dang-ky"]
        Pydantic["Pydantic Validator\nDangKy(ma_sv, ma_phien)"]
    end

    subgraph Storage["Lưu trữ"]
        DB[("SQLite Database\nngayhoi.db / :memory:\nBảng: dang_ky")]
    end

    UI -- "1. fetch POST /api/dang-ky" --> CORS
    CORS --> FastAPI
    FastAPI -- "2. Kiểm tra kiểu dữ liệu" --> Pydantic
    Pydantic -- "3. Dữ liệu hợp lệ" --> DB
    DB -- "4. Kết quả ghi / Lỗi UNIQUE" --> FastAPI
    FastAPI -- "5. Trả mã phản hồi (201 / 409 / 422)" --> UI
```

## 2. Sơ đồ Tuần tự Chi tiết (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor SinhVien as Sinh viên
    participant UI as Giao diện (React/Vite)
    participant API as FastAPI Backend
    participant DB as CSDL SQLite

    SinhVien->>UI: Nhập ma_sv & chọn ma_phien, bấm "Đăng ký"
    UI->>API: POST /api/dang-ky { ma_sv, ma_phien }

    alt Trường hợp 1: Thiếu trường hoặc sai kiểu dữ liệu
        API-->>UI: 422 Unprocessable Entity
        UI-->>SinhVien: Báo lỗi "Vui lòng nhập đầy đủ thông tin"
    else Trường hợp 2: Dữ liệu hợp lệ và chưa từng đăng ký
        API->>DB: INSERT INTO dang_ky VALUES (ma_sv, ma_phien)
        DB-->>API: Ghi thành công
        API-->>UI: 201 Created { ok: true }
        UI-->>SinhVien: Trạng thái THÀNH CÔNG: "Đăng ký thành công!"
    else Trường hợp 3: Sinh viên đã đăng ký phiên này trước đó
        API->>DB: INSERT INTO dang_ky VALUES (ma_sv, ma_phien)
        DB-->>API: sqlite3.IntegrityError (Vi phạm UNIQUE)
        API-->>UI: 409 Conflict { detail: "DA_DANG_KY" }
        UI-->>SinhVien: Trạng thái XUNG ĐỘT: "Bạn đã đăng ký phiên này rồi!"
    end
```

## 3. Bảng Ánh Xạ Mã Phản Hồi (HTTP Status Codes)

| Mã HTTP | Tình huống | Thân phản hồi (JSON) | Phản hồi trên Giao diện |
|---|---|---|---|
| **201 Created** | Đăng ký thành công lần đầu | `{"ok": true}` | Thông báo màu xanh: "Đăng ký thành công!" |
| **409 Conflict** | Đã đăng ký phiên này trước đó | `{"detail": "DA_DANG_KY"}` | Thông báo màu vàng/đỏ: "Sinh viên đã đăng ký phiên này" |
| **422 Unprocessable** | Thiếu `ma_sv` hoặc `ma_phien` | `{"detail": [{"loc": [...], "msg": "Field required"}]}` | Thông báo cảnh báo dữ liệu không hợp lệ |
