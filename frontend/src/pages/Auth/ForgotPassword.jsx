import AuthLayout from "../../components/auth/AuthLayout";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";

function ForgotPassword() {
    return (
        <AuthLayout
            title="Quên mật khẩu"
            subtitle="Nhập email để nhận mã OTP đặt lại mật khẩu."
        >
            <ForgotPasswordForm />
        </AuthLayout>
    );
}

export default ForgotPassword;
