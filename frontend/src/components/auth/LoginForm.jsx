import { useState } from "react";
import { Link } from "react-router-dom";
import PasswordInput from "./PasswordInput";
import SocialLogin from "./SocialLogin";

function LoginForm() {
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

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Đăng nhập (UI tạm) — chưa nối API.");
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

            <button type="submit" className="btn btn-primary auth-btn">
                Đăng nhập
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
