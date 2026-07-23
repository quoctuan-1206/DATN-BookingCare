import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function PasswordInput({
    name,
    value,
    onChange,
    placeholder = "Nhập mật khẩu",
    required = true,
}) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="password-input">
            <input
                type={showPassword ? "text" : "password"}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
            />

            <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
}

export default PasswordInput;
