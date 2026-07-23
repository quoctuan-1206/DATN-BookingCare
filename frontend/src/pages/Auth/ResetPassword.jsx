import AuthLayout from "../../components/auth/AuthLayout";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";

function ResetPassword() {
    return (
        <AuthLayout
            title="Đặt lại mật khẩu"
            subtitle="Tạo mật khẩu mới cho tài khoản của bạn."
        >
            <ResetPasswordForm />
        </AuthLayout>
    );
}

export default ResetPassword;
