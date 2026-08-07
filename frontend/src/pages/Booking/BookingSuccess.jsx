import { Link, useLocation, Navigate } from "react-router-dom";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";

function BookingSuccess() {
    const location = useLocation();
    const booking = location.state?.booking;

    if (!booking) {
        return <Navigate to="/booking" replace />;
    }

    return (
        <>
            <Header />

            <section className="section booking-section">
                <div className="container">
                    <div className="booking-success-card">
                        <div className="success-icon" aria-hidden="true">
                            ✓
                        </div>

                        <p className="booking-eyebrow">Booking Care</p>
                        <h1>Đặt lịch thành công</h1>

                        <p className="success-message">
                            Lịch khám đã được tạo thành công. Vui lòng đến đúng
                            giờ hoặc theo dõi trạng thái lịch hẹn trong tài
                            khoản.
                        </p>

                        <div className="success-info">
                            <div className="success-row success-row--highlight">
                                <span>Mã lịch hẹn</span>
                                <strong>{booking.bookingCode}</strong>
                            </div>

                            <div className="success-row">
                                <span>Bệnh nhân</span>
                                <strong>{booking.patient}</strong>
                            </div>

                            <div className="success-row">
                                <span>Bác sĩ</span>
                                <strong>{booking.doctorName}</strong>
                            </div>

                            <div className="success-row">
                                <span>Chuyên khoa</span>
                                <strong>{booking.specialty}</strong>
                            </div>

                            <div className="success-row">
                                <span>Phòng khám</span>
                                <strong>{booking.clinic}</strong>
                            </div>

                            <div className="success-row">
                                <span>Ngày khám</span>
                                <strong>{booking.date}</strong>
                            </div>

                            <div className="success-row">
                                <span>Khung giờ</span>
                                <strong>{booking.time}</strong>
                            </div>

                            <div className="success-row">
                                <span>Lý do khám</span>
                                <strong>{booking.reason}</strong>
                            </div>

                            <div className="success-row">
                                <span>Phí khám</span>
                                <strong>{booking.fee}</strong>
                            </div>
                        </div>

                        <div className="success-actions">
                            <Link to="/" className="btn btn-outline">
                                Về trang chủ
                            </Link>

                            <Link
                                to="/patient/appointments"
                                className="btn btn-primary"
                            >
                                Xem lịch hẹn
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}

export default BookingSuccess;
