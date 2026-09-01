import AuthLayout from "../../components/auth/AuthLayout";
import LoginForm from "../../components/auth/LoginForm";

function Login() {
    return (
        <AuthLayout
            title="Đăng nhập"
            subtitle="Chào mừng bạn quay lại MediUTE."
        >
            <LoginForm />
        </AuthLayout>
    );
}

export default Login;
