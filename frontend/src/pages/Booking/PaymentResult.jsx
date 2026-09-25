import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import paymentService from "../../services/payment.service";
import toast from "react-hot-toast";

function PaymentResult() {
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get("invoiceId");
  const statusParam = searchParams.get("status");

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const pollIntervalRef = useRef(null);

  useEffect(() => {
    if (!invoiceId || statusParam === "invalid" || statusParam === "not_found") {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let elapsedSeconds = 0;

    const checkStatus = async () => {
      try {
        const res = await paymentService.getStatus(invoiceId);
        if (!isMounted) return;

        setPaymentData(res);
        setLoading(false);
        setPollCount((prev) => prev + 1);

        // Dừng polling khi đã thanh toán thành công hoặc không thể thử lại
        if (res.payment_status === "PAID" || !res.can_retry) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (error) {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    // Gọi ngay khi mount
    checkStatus();

    // Polling mỗi 2 giây, tối đa 30 giây
    pollIntervalRef.current = setInterval(() => {
      elapsedSeconds += 2;
      if (elapsedSeconds >= 30) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
      checkStatus();
    }, 2000);

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [invoiceId, statusParam]);

  const handleRetryPayment = async () => {
    if (!invoiceId) return;
    setRetrying(true);
    try {
      const res = await paymentService.createPaymentUrl(invoiceId);
      if (res?.payment_url) {
        window.location.assign(res.payment_url);
      } else {
        toast.error("Không nhận được link thanh toán từ hệ thống");
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Không thể tạo lại link thanh toán";
      toast.error(msg);
    } finally {
      setRetrying(false);
    }
  };

  // 1. Trạng thái không hợp lệ hoặc lỗi tham số
  if (statusParam === "invalid" || statusParam === "not_found" || (!loading && !invoiceId)) {
    return (
      <>
        <Header />
        <section className="section booking-section">
          <div className="container">
            <div className="booking-success-card">
              <div
                className="success-icon"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}
                aria-hidden="true"
              >
                ✕
              </div>
              <p className="booking-eyebrow">Cổng thanh toán VNPAY</p>
              <h1>Thông tin thanh toán không hợp lệ</h1>
              <p className="success-message">
                Không thể xác thực thông tin giao dịch thanh toán hoặc mã hóa đơn không tồn tại.
              </p>
              <div className="success-actions">
                <Link to="/" className="btn btn-outline">
                  Về trang chủ
                </Link>
                <Link to="/patient/appointments" className="btn btn-primary">
                  Xem lịch hẹn của tôi
                </Link>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  // 2. Trạng thái đang tải lần đầu
  if (loading && !paymentData) {
    return (
      <>
        <Header />
        <section className="section booking-section">
          <div className="container">
            <div className="booking-success-card">
              <p className="booking-eyebrow">Cổng thanh toán VNPAY</p>
              <h1>Đang kiểm tra kết quả...</h1>
              <p className="success-message">
                Vui lòng đợi giây lát, hệ thống đang đồng bộ kết quả từ VNPAY.
              </p>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  const isPaid = paymentData?.payment_status === "PAID";
  const canRetry = Boolean(paymentData?.can_retry);

  // 3. Trạng thái ĐÃ THANH TOÁN THÀNH CÔNG
  if (isPaid) {
    return (
      <>
        <Header />
        <section className="section booking-section">
          <div className="container">
            <div className="booking-success-card">
              <div className="success-icon" aria-hidden="true">
                ✓
              </div>
              <p className="booking-eyebrow">Cổng thanh toán VNPAY</p>
              <h1>Thanh toán thành công</h1>
              <p className="success-message">
                Giao dịch thanh toán phí khám qua VNPAY đã được ghi nhận. Lịch hẹn của quý khách đã hoàn tất thủ tục thanh toán.
              </p>

              {paymentData?.amount != null && (
                <div className="success-info">
                  <div className="success-row success-row--highlight">
                    <span>Số tiền đã thanh toán</span>
                    <strong>{paymentData.amount.toLocaleString("vi-VN")} đ</strong>
                  </div>
                </div>
              )}

              <div className="success-actions">
                <Link to="/" className="btn btn-outline">
                  Về trang chủ
                </Link>
                {paymentData?.appointment_id ? (
                  <Link
                    to={`/patient/appointments/${paymentData.appointment_id}`}
                    className="btn btn-primary"
                  >
                    Xem chi tiết lịch hẹn
                  </Link>
                ) : (
                  <Link to="/patient/appointments" className="btn btn-primary">
                    Xem danh sách lịch hẹn
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  // 4. Trạng thái HẾT HẠN hoặc ĐÃ HỦY
  if (!canRetry) {
    return (
      <>
        <Header />
        <section className="section booking-section">
          <div className="container">
            <div className="booking-success-card">
              <div
                className="success-icon"
                style={{ backgroundColor: "#f59e0b", color: "#fff" }}
                aria-hidden="true"
              >
                !
              </div>
              <p className="booking-eyebrow">Cổng thanh toán VNPAY</p>
              <h1>Lịch hẹn đã hết hạn thanh toán</h1>
              <p className="success-message">
                Thời hạn thanh toán 10 phút đã kết thúc và lịch hẹn này đã tự động bị hủy để hoàn trả khung giờ khám.
              </p>
              <div className="success-actions">
                <Link to="/" className="btn btn-outline">
                  Về trang chủ
                </Link>
                <Link to="/doctors" className="btn btn-primary">
                  Đặt lịch khám mới
                </Link>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  // 5. Trạng thái ĐANG CHỜ XÁC NHẬN / CHO PHÉP THANH TOÁN LẠI
  return (
    <>
      <Header />
      <section className="section booking-section">
        <div className="container">
          <div className="booking-success-card">
            <div
              className="success-icon"
              style={{ backgroundColor: "#3b82f6", color: "#fff" }}
              aria-hidden="true"
            >
              ⏱
            </div>
            <p className="booking-eyebrow">Cổng thanh toán VNPAY</p>
            <h1>Đang chờ VNPAY xác nhận</h1>
            <p className="success-message">
              Hệ thống đang chờ tín hiệu hoàn tất thanh toán từ cổng VNPAY. Nếu quý khách đã quét mã thành công, vui lòng giữ trang trong giây lát. Nếu chưa hoàn tất, quý khách có thể thực hiện thanh toán lại.
            </p>

            {paymentData?.amount != null && (
              <div className="success-info">
                <div className="success-row">
                  <span>Phí khám cần thanh toán</span>
                  <strong>{paymentData.amount.toLocaleString("vi-VN")} đ</strong>
                </div>
              </div>
            )}

            <div className="success-actions">
              <Link to="/patient/appointments" className="btn btn-outline">
                Xem lịch hẹn
              </Link>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRetryPayment}
                disabled={retrying}
              >
                {retrying ? "Đang chuyển tiếp..." : "Thanh toán lại"}
              </button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default PaymentResult;
