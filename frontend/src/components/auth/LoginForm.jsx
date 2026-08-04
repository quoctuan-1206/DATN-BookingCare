import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PasswordInput from "./PasswordInput";
import SocialLogin from "./SocialLogin";
import { useAuth } from "../../context/AuthContext";

function LoginForm() {
  const navigate = useNavigate();
  const { login, getApiErrorMessage } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      toast.success("Đăng nhập thành công");
      navigate(result.redirectTo);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Đăng nhập thất bại"));
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
          name="email"
          placeholder="Nhập email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Mật khẩu</label>
        <PasswordInput
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Nhập mật khẩu"
        />
      </div>

      <div className="auth-options">
        <label className="remember-me">
          <input
            type="checkbox"
            name="remember"
            checked={formData.remember}
            onChange={handleChange}
          />
          Ghi nhớ đăng nhập
        </label>

        <Link to="/forgot-password" className="forgot-password">
          Quên mật khẩu?
        </Link>
      </div>

      <button
        type="submit"
        className="btn btn-primary auth-btn"
        disabled={loading}
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>

      <div className="auth-divider">
        <span>Hoặc</span>
      </div>

      <SocialLogin />

      <div className="auth-footer">
        Chưa có tài khoản?
        <Link to="/register">Đăng ký ngay</Link>
      </div>
    </form>
  );
}

export default LoginForm;
