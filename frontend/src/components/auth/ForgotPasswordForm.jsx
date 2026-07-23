import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function ForgotPasswordForm() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate("/verify-otp", { state: { email } });
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

            <button type="submit" className="btn btn-primary auth-btn">
                Gửi mã OTP
            </button>

            <div className="auth-footer">
                Nhớ mật khẩu?
                <Link to="/login">Đăng nhập</Link>
            </div>
        </form>
    );
}

export default ForgotPasswordForm;
