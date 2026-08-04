import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import authService from "../../services/auth.service";
import { getApiErrorMessage } from "../../api/axios";

function VerifyOTPForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error("Thiếu email. Vui lòng nhập lại.");
      navigate("/forgot-password", { replace: true });
    }
  }, [email, navigate]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      toast.error("Vui lòng nhập đủ 6 số OTP");
      return;
    }

    setLoading(true);

    try {
      await authService.verifyOTP(email, otpCode);
      toast.success("Xác thực OTP thành công");
      navigate("/reset-password", { state: { email } });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "OTP không hợp lệ"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);

    try {
      await authService.forgotPassword(email);
      toast.success("Đã gửi lại mã OTP");
      setOtp(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không gửi lại được OTP"));
    } finally {
      setResending(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <p style={{ marginBottom: 18, color: "#666", fontSize: 14 }}>
        Mã OTP đã gửi tới <strong>{email || "email của bạn"}</strong>.
        Kiểm tra console backend nếu chưa gắn gửi mail.
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
        <button type="button" onClick={handleResend} disabled={resending}>
          {resending ? "Đang gửi..." : "Gửi lại"}
        </button>
      </div>

      <button
        type="submit"
        className="btn btn-primary auth-btn"
        disabled={loading}
      >
        {loading ? "Đang xác nhận..." : "Xác nhận OTP"}
      </button>

      <div className="auth-footer">
        <Link to="/login">Quay lại đăng nhập</Link>
      </div>
    </form>
  );
}

export default VerifyOTPForm;
