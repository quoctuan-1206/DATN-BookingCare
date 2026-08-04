import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PasswordInput from "./PasswordInput";
import SocialLogin from "./SocialLogin";
import { useAuth } from "../../context/AuthContext";

function RegisterForm() {
  const navigate = useNavigate();
  const { register, getApiErrorMessage } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agree: false,
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

    if (!formData.agree) {
      toast.error("Vui lòng đồng ý điều khoản sử dụng");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      toast.success("Đăng ký thành công");
      navigate(result.redirectTo);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Đăng ký thất bại"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-grid">
        <div className="form-group">
          <label>Họ</label>
          <input
            type="text"
            name="lastName"
            placeholder="Nhập họ"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Tên</label>
          <input
            type="text"
            name="firstName"
            placeholder="Nhập tên"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
      </div>

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
        <label>Số điện thoại</label>
        <input
          type="tel"
          name="phone"
          placeholder="Nhập số điện thoại"
          value={formData.phone}
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

      <div className="form-group">
        <label>Xác nhận mật khẩu</label>
        <PasswordInput
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Nhập lại mật khẩu"
        />
      </div>

      <label className="remember-me">
        <input
          type="checkbox"
          name="agree"
          checked={formData.agree}
          onChange={handleChange}
        />
        Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật
      </label>

      <button
        type="submit"
        className="btn btn-primary auth-btn"
        disabled={loading}
      >
        {loading ? "Đang đăng ký..." : "Đăng ký"}
      </button>

      <div className="auth-divider">
        <span>Hoặc</span>
      </div>

      <SocialLogin />

      <div className="auth-footer">
        Đã có tài khoản?
        <Link to="/login">Đăng nhập</Link>
      </div>
    </form>
  );
}

export default RegisterForm;
