import { useState } from "react";
import { Link } from "react-router-dom";
import PasswordInput from "./PasswordInput";
import SocialLogin from "./SocialLogin";

function RegisterForm() {
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

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Đăng ký (UI tạm) — chưa nối API.");
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

            <button type="submit" className="btn btn-primary auth-btn">
                Đăng ký
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
