import AuthLayout from "../../components/auth/AuthLayout";
import VerifyOTPForm from "../../components/auth/VerifyOTPForm";

function VerifyOTP() {
    return (
        <AuthLayout
            title="Xác thực OTP"
            subtitle="Nhập mã 6 số được gửi tới email của bạn."
        >
            <VerifyOTPForm />
        </AuthLayout>
    );
}

export default VerifyOTP;
