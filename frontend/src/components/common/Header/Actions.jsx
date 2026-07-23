import { Link } from "react-router-dom";

function Actions() {
    return (
        <div className="actions">
            <button type="button" className="support-btn">
                Hỗ trợ
            </button>

            <Link to="/login" className="login-btn">
                Đăng nhập
            </Link>
        </div>
    );
}

export default Actions;
