import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function VerifyOTPForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "email của bạn";

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputsRef = useRef([]);

    const handleChange = (index, value) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const next = [...otp];
        next[index] = digit;
        setOtp(next);

        if (digit && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate("/reset-password", { state: { email } });
    };

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <p style={{ marginBottom: 18, color: "#666", fontSize: 14 }}>
                Mã OTP đã gửi tới <strong>{email}</strong> (UI tạm).
            </p>

            <div className="otp-inputs">
                {otp.map((value, index) => (
                    <input
                        key={index}
                        ref={(el) => {
                            inputsRef.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={value}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        required
                    />
                ))}
            </div>

            <div className="otp-resend">
                Không nhận được mã?{" "}
                <button type="button" onClick={() => alert("Gửi lại OTP (UI tạm).")}>
                    Gửi lại
                </button>
            </div>

            <button type="submit" className="btn btn-primary auth-btn">
                Xác nhận OTP
            </button>

            <div className="auth-footer">
                <Link to="/login">Quay lại đăng nhập</Link>
            </div>
        </form>
    );
}

export default VerifyOTPForm;
