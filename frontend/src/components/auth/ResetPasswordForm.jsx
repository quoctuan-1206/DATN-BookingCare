import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PasswordInput from "./PasswordInput";
import authService from "../../services/auth.service";
import { getApiErrorMessage } from "../../api/axios";

function ResetPasswordForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!email) {
      toast.error("Thiếu email. Vui lòng xác thực OTP lại.");
      navigate("/forgot-password", { replace: true });
    }
  }, [email, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(email, formData.password);
      toast.success("Đặt lại mật khẩu thành công");
      navigate("/login");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không đặt lại được mật khẩu"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Mật khẩu mới</label>
        <PasswordInput
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Nhập mật khẩu mới"
        />
      </div>

      <div className="form-group">
        <label>Xác nhận mật khẩu</label>
        <PasswordInput
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Nhập lại mật khẩu mới"
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary auth-btn"
        disabled={loading}
      >
        {loading ? "Đang lưu..." : "Đặt lại mật khẩu"}
      </button>

      <div className="auth-footer">
        <Link to="/login">Quay lại đăng nhập</Link>
      </div>
    </form>
  );
}

export default ResetPasswordForm;
