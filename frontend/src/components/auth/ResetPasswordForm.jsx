import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordInput from "./PasswordInput";

function ResetPasswordForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Mật khẩu xác nhận không khớp.");
            return;
        }
        alert("Đặt lại mật khẩu thành công (UI tạm).");
        navigate("/login");
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

            <button type="submit" className="btn btn-primary auth-btn">
                Đặt lại mật khẩu
            </button>

            <div className="auth-footer">
                <Link to="/login">Quay lại đăng nhập</Link>
            </div>
        </form>
    );
}

export default ResetPasswordForm;
