import AuthLayout from "../../components/auth/AuthLayout";
import RegisterForm from "../../components/auth/RegisterForm";

function Register() {
    return (
        <AuthLayout
            title="Đăng ký"
            subtitle="Tạo tài khoản để đặt lịch khám nhanh chóng."
        >
            <RegisterForm />
        </AuthLayout>
    );
}

export default Register;
