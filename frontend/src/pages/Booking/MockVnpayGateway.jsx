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

  const [method, setMethod] = useState("qr"); // 'qr' | 'bank'
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes demo

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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
      {/* Header phong cách VNPAY */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 px-3 bg-blue-700 text-white font-black text-xl italic flex items-center rounded tracking-wider shadow">
              VN<span className="text-red-500">PAY</span>
            </div>
            <div className="border-l border-slate-300 pl-3">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">
                Cổng thanh toán điện tử
              </span>
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full inline-block">
                Mô phỏng Sandbox
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Clock size={16} className="text-amber-600 animate-pulse" />
            <span>Thời gian còn lại:</span>
            <strong className="text-amber-700 font-mono text-base">{timeFormatted}</strong>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full my-6 px-4">
        {/* Banner thông báo chế độ Mock */}
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-amber-900 text-sm">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div>
            <strong>Chế độ Mock Gateway (Dành cho kiểm thử Đồ án):</strong>
            <p className="text-xs text-amber-800 mt-0.5">
              Trang này mô phỏng toàn bộ trải nghiệm thanh toán của VNPAY Sandbox để bạn test và demo chức năng trơn tru mà không cần tài khoản thật.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Thông tin đơn hàng */}
          <div className="md:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Thông tin đơn hàng
              </h2>

              <div className="space-y-3.5 mt-4 text-sm">
                <div>
                  <span className="text-slate-500 text-xs block">Đơn vị thụ hưởng</span>
                  <strong className="text-slate-700 font-medium">Bệnh viện / Phòng khám MediUTE</strong>
                </div>

                <div>
                  <span className="text-slate-500 text-xs block">Mã đặt khám</span>
                  <code className="text-blue-700 font-mono font-semibold bg-blue-50 px-1.5 py-0.5 rounded text-xs">
                    {bookingCode}
                  </code>
                </div>

                <div>
                  <span className="text-slate-500 text-xs block">Mã giao dịch (TxnRef)</span>
                  <span className="text-slate-600 font-mono text-xs break-all">{txnRef}</span>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-slate-500 text-xs block">Số tiền cần thanh toán</span>
                  <strong className="text-2xl font-black text-blue-700 mt-1 block">
                    {formatMoney(amount)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-1.5 justify-center">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Giao dịch an toàn 256-bit SSL</span>
            </div>
          </div>

          {/* Vùng chọn phương thức & Thao tác thanh toán */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
                Chọn phương thức thanh toán
              </h2>

              {/* Tabs chọn phương thức */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setMethod("qr")}
                  className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                    method === "qr"
                      ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <QrCode size={18} />
                  VNPAY-QR
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("bank")}
                  className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                    method === "bank"
                      ? "border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CreditCard size={18} />
                  Thẻ ATM / NCB Test
                </button>
              </div>

              {/* Nội dung theo Tab */}
              <div className="mt-5 p-5 bg-slate-50 rounded-xl border border-slate-200/80">
                {method === "qr" ? (
                  <div className="text-center py-2">
                    <p className="text-xs text-slate-600 mb-3 font-medium">
                      Mở ứng dụng Ngân hàng hoặc Ví VNPAY quét mã QR bên dưới
                    </p>
                    <div className="inline-block p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                      {/* Giả lập hình ảnh mã QR */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=VNPAY-MOCK-${invoiceId}-${amount}`}
                        alt="QR Code"
                        className="w-44 h-44 mx-auto rounded"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Mã QR có giá trị trong 10 phút</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 pb-2 border-b border-slate-200">
                      <Building2 size={16} className="text-blue-600" />
                      Ngân hàng Quốc dân (NCB) — Môi trường thử nghiệm
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Số thẻ:</span>
                        <strong className="font-mono text-slate-800">9704198526191432198</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Tên chủ thẻ:</span>
                        <strong className="font-mono text-slate-800">NGUYEN VAN A</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Ngày phát hành:</span>
                        <strong className="font-mono text-slate-800">07/15</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Mã OTP:</span>
                        <strong className="font-mono text-slate-800">123456</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Các nút bấm mô phỏng */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={handlePaySuccess}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer text-sm"
              >
                <CheckCircle2 size={18} />
                {submitting ? "Đang xử lý..." : "Xác nhận thanh toán (Mô phỏng thành công)"}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleCancel}
                className="bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-sm"
              >
                <XCircle size={18} />
                Hủy / Đóng
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200 bg-white">
        © 2026 VNPAY Sandbox Simulator — Phục vụ mục đích kiểm thử và demo Đồ án tốt nghiệp
      </footer>
    </div>
  );
}
