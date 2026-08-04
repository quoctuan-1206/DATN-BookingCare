import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import authService from "../../services/auth.service";
import { getApiErrorMessage } from "../../api/axios";

function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      toast.success(res.data?.message || "Đã gửi mã OTP");
      navigate("/verify-otp", { state: { email } });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không gửi được OTP"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          placeholder="Nhập email đã đăng ký"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary auth-btn"
        disabled={loading}
      >
        {loading ? "Đang gửi..." : "Gửi mã OTP"}
      </button>

      <div className="auth-footer">
        Nhớ mật khẩu?
        <Link to="/login">Đăng nhập</Link>
      </div>
    </form>
  );
}

export default ForgotPasswordForm;
