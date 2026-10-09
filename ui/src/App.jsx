import React, { useState } from 'react'
import sessionsData from './phien.json'

function App() {
  const [maSv, setMaSv] = useState('')
  const [maPhien, setMaPhien] = useState('P01')
  const [loading, setLoading] = useState(false)
  const [statusState, setStatusState] = useState({
    type: 'idle', // 'idle' | 'success' | 'conflict' | 'error'
    message: '',
    statusCode: null,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!maSv.trim()) {
      setStatusState({
        type: 'error',
        message: 'Vui lòng nhập Mã sinh viên (ví dụ: 22020001)',
        statusCode: 422,
      })
      return
    }

    setLoading(true)
    setStatusState({ type: 'idle', message: '', statusCode: null })

    try {
      const response = await fetch('http://localhost:8000/api/dang-ky', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ma_sv: maSv.trim(),
          ma_phien: maPhien,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.status === 201) {
        // TRẠNG THÁI 2: ĐĂNG KÝ THÀNH CÔNG (201)
        setStatusState({
          type: 'success',
          message: `Chúc mừng bạn! Sinh viên ${maSv} đã đăng ký thành công phiên ${maPhien}.`,
          statusCode: 201,
        })
      } else if (response.status === 409) {
        // TRẠNG THÁI 3: XUNG ĐỘT (409 DA_DANG_KY hoặc HET_CHO)
        const detailMsg = data.detail === 'HET_CHO'
          ? `Rất tiếc! Phiên ${maPhien} đã hết chỗ (đủ 30 sinh viên).`
          : `Bạn đã đăng ký phiên ${maPhien} này rồi (Mã: DA_DANG_KY).`

        setStatusState({
          type: 'conflict',
          message: detailMsg,
          statusCode: 409,
        })
      } else if (response.status === 422) {
        setStatusState({
          type: 'error',
          message: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin gửi lên (422 Unprocessable Entity).',
          statusCode: 422,
        })
      } else {
        setStatusState({
          type: 'error',
          message: `Lỗi máy chủ (${response.status}): ${data.detail || 'Không thể thực hiện đăng ký'}`,
          statusCode: response.status,
        })
      }
    } catch (err) {
      setStatusState({
        type: 'error',
        message: 'Không thể kết nối đến máy chủ backend (http://localhost:8000). Vui lòng kiểm tra lại máy chủ!',
        statusCode: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedSession = sessionsData.find((s) => s.ma_phien === maPhien)

  return (
    <div className="container">
      {/* HEADER BANNER */}
      <header className="header">
        <h1>VJU - ĐHQGHN · CỔNG ĐĂNG KÝ NGÀY HỘI VIỆC LÀM 2026</h1>
        <p>Hệ thống đăng ký phiên tuyển dụng & phỏng vấn trực tiếp cùng doanh nghiệp</p>
      </header>

      {/* KHỐI FORM ĐĂNG KÝ (TRẠNG THÁI 1: CHỜ NHẬP) */}
      <div className="card">
        <h2 className="card-title">Phiếu Đăng Ký Tham Gia</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="ma_sv">Mã Sinh Viên (MSSV):</label>
            <input
              id="ma_sv"
              type="text"
              placeholder="Ví dụ: 22020001"
              value={maSv}
              onChange={(e) => setMaSv(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="ma_phien">Chọn Phiên Tuyển Dụng:</label>
            <select
              id="ma_phien"
              value={maPhien}
              onChange={(e) => setMaPhien(e.target.value)}
              disabled={loading}
            >
              {sessionsData.map((s) => (
                <option key={s.ma_phien} value={s.ma_phien}>
                  [{s.ma_phien}] {s.doanh_nghiep} - {s.vi_tri} ({s.bat_dau} - {s.ket_thuc} | {s.phong})
                </option>
              ))}
            </select>
          </div>

          {selectedSession && (
            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#4b5563' }}>
              Phiên đã chọn: <strong>{selectedSession.doanh_nghiep}</strong> ({selectedSession.vi_tri}) - Phòng: {selectedSession.phong}
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Đang xử lý đăng ký...' : 'Xác Nhận Đăng Ký'}
          </button>
        </form>

        {/* TRẠNG THÁI 2: ĐĂNG KÝ THÀNH CÔNG (201) */}
        {statusState.type === 'success' && (
          <div className="alert alert-success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <strong>Mã phản hồi: 201 Created</strong>
              <div>{statusState.message}</div>
            </div>
          </div>
        )}

        {/* TRẠNG THÁI 3: XUNG ĐỘT (409 CONFLICT) */}
        {statusState.type === 'conflict' && (
          <div className="alert alert-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>Mã phản hồi: 409 Conflict</strong>
              <div>{statusState.message}</div>
            </div>
          </div>
        )}

        {/* TRẠNG THÁI LỖI KHÁC (422 / 500 / Network) */}
        {statusState.type === 'error' && (
          <div className="alert alert-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>Lỗi (Mã: {statusState.statusCode || 'Mạng'}):</strong>
              <div>{statusState.message}</div>
            </div>
          </div>
        )}
      </div>

      {/* DANH SÁCH 8 PHIÊN NGÀY HỘI */}
      <div className="card">
        <h2 className="card-title">Lịch Các Phiên Ngày Hội Việc Làm (14/11/2026)</h2>
        <div className="sessions-grid">
          {sessionsData.map((s) => {
            const isFull = s.con_cho === 0
            const isSelected = s.ma_phien === maPhien
            return (
              <div
                key={s.ma_phien}
                className={`session-item ${isSelected ? 'selected' : ''}`}
                onClick={() => setMaPhien(s.ma_phien)}
              >
                <div className="session-header">
                  <span className="session-code">{s.ma_phien}</span>
                  <span className={`badge ${isFull ? 'badge-full' : 'badge-available'}`}>
                    {isFull ? 'Hết chỗ (0/30)' : `Còn ${s.con_cho}/30 chỗ`}
                  </span>
                </div>
                <div className="session-corp">{s.doanh_nghiep}</div>
                <div className="session-details">
                  <div>Vị trí: <strong>{s.vi_tri}</strong></div>
                  <div>Thời gian: {s.bat_dau} - {s.ket_thuc}</div>
                  <div>Địa điểm: {s.phong}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default App
