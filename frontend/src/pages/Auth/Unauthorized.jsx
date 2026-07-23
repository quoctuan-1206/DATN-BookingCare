import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import AuthLayout from "../../components/auth/AuthLayout";

function Unauthorized() {
    return (
        <AuthLayout
            title="Không có quyền truy cập"
            subtitle="Bạn không được phép xem trang này."
        >
            <div className="auth-unauthorized">
                <div className="auth-unauthorized-icon">
                    <ShieldAlert size={32} />
                </div>

                <p>
                    Tài khoản hiện tại không đủ quyền. Hãy đăng nhập bằng tài
                    khoản phù hợp hoặc quay về trang chủ.
                </p>

                <div className="auth-unauthorized-actions">
                    <Link to="/login" className="btn btn-primary auth-btn">
                        Đăng nhập
                    </Link>
                    <Link to="/" className="auth-btn-outline">
                        Về trang chủ
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}

export default Unauthorized;
