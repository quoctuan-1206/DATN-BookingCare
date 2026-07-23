import AuthLayout from "../../components/auth/AuthLayout";
import LoginForm from "../../components/auth/LoginForm";

function Login() {
    return (
        <AuthLayout
            title="Đăng nhập"
            subtitle="Chào mừng bạn quay lại Booking Care."
        >
            <LoginForm />
        </AuthLayout>
    );
}

export default Login;
