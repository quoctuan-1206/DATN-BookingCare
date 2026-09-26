import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  FileText,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import paymentService from "../../services/payment.service";
import "../../styles/mock-vnpay.css";

function formatMoney(amount) {
  return `${Number(amount || 0).toLocaleString("vi-VN")} VND`;
}

export default function MockVnpayGateway() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const invoiceId = searchParams.get("invoiceId");
  const amount = searchParams.get("amount") || "200000";
  const txnRef = searchParams.get("txnRef") || `INV${Date.now()}`;
  const bookingCode = searchParams.get("bookingCode") || "BK-TEST";
  const patientName = searchParams.get("patientName") || "";

  const [method, setMethod] = useState("qr"); // 'qr' | 'bank'
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const handlePaySuccess = async () => {
    if (!invoiceId) {
      toast.error("Thiếu mã hóa đơn");
      return;
    }
    setSubmitting(true);
    try {
      await paymentService.mockComplete(invoiceId);
      toast.success("Giả lập thanh toán thành công!");
      navigate(`/payment/result?invoiceId=${invoiceId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi xử lý thanh toán giả lập");
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (invoiceId) {
      navigate(`/payment/result?invoiceId=${invoiceId}&status=failed`);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="mock-vnpay-page">
      {/* Header phong cách VNPAY */}
      <header className="mock-vnpay-header">
        <div className="mock-vnpay-header-inner">
          <div className="mock-vnpay-brand">
            <div className="mock-vnpay-logo-badge">
              VN<span>PAY</span>
            </div>
            <div className="mock-vnpay-brand-sub">
              <span className="mock-vnpay-brand-title">Cổng thanh toán điện tử</span>
              <span className="mock-vnpay-badge-sandbox">Mô phỏng Sandbox</span>
            </div>
          </div>
          <div className="mock-vnpay-timer">
            <Clock size={16} color="#d97706" />
            <span>Thời gian còn lại:</span>
            <strong>{timeFormatted}</strong>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mock-vnpay-main">
        {/* Banner thông báo chế độ Mock */}
        <div className="mock-vnpay-alert">
          <AlertTriangle color="#d97706" size={18} style={{ flexShrink: 0 }} />
          <strong>Chế độ Mock Gateway</strong>
        </div>

        <div className="mock-vnpay-grid">
          {/* Thông tin đơn hàng */}
          <div className="mock-vnpay-card">
            <div>
              <h2 className="mock-vnpay-card-title">
                <FileText size={18} color="#005baa" />
                Thông tin đơn hàng
              </h2>

              <div className="mock-vnpay-info-list">
                <div>
                  <span className="mock-vnpay-info-label">Đơn vị thụ hưởng</span>
                  <span className="mock-vnpay-info-val">Bệnh viện / Phòng khám MediUTE</span>
                </div>

                <div>
                  <span className="mock-vnpay-info-label">Mã đặt khám</span>
                  <code style={{ color: "#005baa", background: "#eff6ff", padding: "2px 6px", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                    {bookingCode}
                  </code>
                </div>

                <div>
                  <span className="mock-vnpay-info-label">Nội dung thanh toán</span>
                  <span className="mock-vnpay-info-val" style={{ color: "#0369a1" }}>
                    {patientName ? `${patientName} đặt lịch khám` : `Thanh toán đặt lịch khám ${bookingCode}`}
                  </span>
                </div>

                <div>
                  <span className="mock-vnpay-info-label">Mã giao dịch (TxnRef)</span>
                  <span style={{ fontSize: 12, fontFamily: "monospace", color: "#64748b", wordBreak: "break-all" }}>
                    {txnRef}
                  </span>
                </div>

                <div className="mock-vnpay-amount-box">
                  <span className="mock-vnpay-info-label">Số tiền cần thanh toán</span>
                  <span className="mock-vnpay-amount">{formatMoney(amount)}</span>
                </div>
              </div>
            </div>

            <div className="mock-vnpay-ssl-note">
              <ShieldCheck size={16} color="#16a34a" />
              <span>Giao dịch an toàn 256-bit SSL</span>
            </div>
          </div>

          {/* Vùng chọn phương thức & Thao tác thanh toán */}
          <div className="mock-vnpay-card">
            <div>
              <h2 className="mock-vnpay-card-title">
                Chọn phương thức thanh toán
              </h2>

              {/* Tabs chọn phương thức */}
              <div className="mock-vnpay-tabs">
                <button
                  type="button"
                  onClick={() => setMethod("qr")}
                  className={`mock-vnpay-tab-btn ${method === "qr" ? "active" : ""}`}
                >
                  <QrCode size={18} />
                  VNPAY-QR
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("bank")}
                  className={`mock-vnpay-tab-btn ${method === "bank" ? "active" : ""}`}
                >
                  <CreditCard size={18} />
                  Thẻ ATM / NCB Test
                </button>
              </div>

              {/* Nội dung theo Tab */}
              <div className="mock-vnpay-method-body">
                {method === "qr" ? (
                  <div className="mock-vnpay-qr-container">
                    <p style={{ fontSize: 13, color: "#475569", marginBottom: 12, fontWeight: 600 }}>
                      Mở ứng dụng Ngân hàng hoặc Ví VNPAY quét mã QR bên dưới
                    </p>
                    <div className="mock-vnpay-qr-box">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=VNPAY-MOCK-${invoiceId}-${amount}`}
                        alt="QR Code"
                      />
                    </div>
                    <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                      Mã QR có giá trị trong 10 phút
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="mock-vnpay-bank-header">
                      <Building2 size={16} color="#005baa" />
                      Ngân hàng Quốc dân (NCB) — Môi trường thử nghiệm
                    </div>
                    <div className="mock-vnpay-bank-grid">
                      <div>
                        <span style={{ color: "#64748b", display: "block" }}>Số thẻ:</span>
                        <strong style={{ fontFamily: "monospace", fontSize: 14 }}>9704198526191432198</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", display: "block" }}>Tên chủ thẻ:</span>
                        <strong style={{ fontFamily: "monospace", fontSize: 14 }}>Nguyễn Quốc Tuất</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", display: "block" }}>Ngày phát hành:</span>
                        <strong style={{ fontFamily: "monospace", fontSize: 14 }}>07/15</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", display: "block" }}>Mã OTP:</span>
                        <strong style={{ fontFamily: "monospace", fontSize: 14 }}>696969</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Các nút bấm mô phỏng */}
            <div className="mock-vnpay-btn-group">
              <button
                type="button"
                disabled={submitting}
                onClick={handlePaySuccess}
                className="mock-btn-success"
              >
                <CheckCircle2 size={18} />
                {submitting ? "Đang xử lý..." : "Xác nhận thanh toán (Mô phỏng thành công)"}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleCancel}
                className="mock-btn-cancel"
              >
                <XCircle size={18} />
                Hủy / Đóng
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mock-vnpay-footer">
        © 2026 VNPAY Sandbox Simulator — Phục vụ mục đích kiểm thử và demo Đồ án tốt nghiệp
      </footer>
    </div>
  );
}
