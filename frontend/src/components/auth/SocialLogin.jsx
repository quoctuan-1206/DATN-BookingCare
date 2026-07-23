function SocialLogin() {
    return (
        <div className="social-login">
            <button
                type="button"
                className="social-btn google"
                onClick={() => alert("Đăng nhập Google (UI tạm).")}
            >
                Google
            </button>

            <button
                type="button"
                className="social-btn facebook"
                onClick={() => alert("Đăng nhập Facebook (UI tạm).")}
            >
                Facebook
            </button>

            <button
                type="button"
                className="social-btn x"
                onClick={() => alert("Đăng nhập X (UI tạm).")}
            >
                X
            </button>
        </div>
    );
}

export default SocialLogin;
