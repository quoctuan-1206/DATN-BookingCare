import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import PatientLayout from "../../components/patient/PatientLayout";
import { GENDER_LABEL, db } from "../../data/patientMock";

function parseBirthday(dateStr) {
    if (!dateStr) return { day: "", month: "", year: "" };
    const [year, month, day] = String(dateStr).split("-");
    return {
        day: day || "",
        month: month || "",
        year: year || "",
    };
}

function Profile() {
    const location = useLocation();
    const isPasswordPage = location.pathname.endsWith("/password");
    const account = db.account;
    const initialBirthday = useMemo(
        () => parseBirthday(account.date_of_birth),
        [account.date_of_birth],
    );

    const [user, setUser] = useState({
        firstName: account.first_name,
        lastName: account.last_name,
        email: account.email || "",
        phone: account.phone,
        gender: GENDER_LABEL[account.gender] || "Nam",
        birthDay: initialBirthday.day,
        birthMonth: initialBirthday.month,
        birthYear: initialBirthday.year,
    });

    const [password, setPassword] = useState({
        current: "",
        next: "",
        confirm: "",
    });

    const hasEmail = Boolean(user.email?.trim());

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        alert(
            `Đã lưu (fake):\n${user.lastName} ${user.firstName}\n${user.phone}`,
        );
    };

    const handlePassword = () => {
        if (!password.current || !password.next) {
            alert("Vui lòng nhập đủ mật khẩu.");
            return;
        }
        if (password.next !== password.confirm) {
            alert("Mật khẩu xác nhận không khớp.");
            return;
        }
        alert("Đã cập nhật mật khẩu (fake).");
        setPassword({ current: "", next: "", confirm: "" });
    };

    return (
        <PatientLayout>
            {isPasswordPage && (
                <div className="patient-password-card">
                    <h1 className="patient-password-title">Đổi mật khẩu</h1>

                    <form
                        className="patient-password-form"
                        autoComplete="off"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <div className="patient-password-fields">
                            <div className="profile-field-row">
                                <label htmlFor="current_password">
                                    Mật khẩu hiện tại
                                    <span className="profile-required">*</span>
                                </label>
                                <input
                                    id="current_password"
                                    className="profile-field-input"
                                    type="password"
                                    placeholder="Mật khẩu hiện tại"
                                    value={password.current}
                                    maxLength={64}
                                    onChange={(e) =>
                                        setPassword((p) => ({
                                            ...p,
                                            current: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="profile-field-row">
                                <label htmlFor="password">
                                    Mật khẩu mới
                                    <span className="profile-required">*</span>
                                </label>
                                <input
                                    id="password"
                                    className="profile-field-input"
                                    type="password"
                                    placeholder="Mật khẩu mới"
                                    value={password.next}
                                    maxLength={64}
                                    onChange={(e) =>
                                        setPassword((p) => ({
                                            ...p,
                                            next: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="profile-field-row">
                                <label htmlFor="confirmation">
                                    Nhập lại mật khẩu mới
                                    <span className="profile-required">*</span>
                                </label>
                                <input
                                    id="confirmation"
                                    className="profile-field-input"
                                    type="password"
                                    placeholder="Nhập lại mật khẩu mới"
                                    value={password.confirm}
                                    maxLength={64}
                                    onChange={(e) =>
                                        setPassword((p) => ({
                                            ...p,
                                            confirm: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="patient-password-actions">
                            <button
                                type="button"
                                className="patient-profile-save-btn"
                                onClick={handlePassword}
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!isPasswordPage && (
                <div className="patient-profile-info-card">
                    <h2 className="patient-profile-info-title">Hồ sơ cá nhân</h2>

                    <div className="patient-profile-info-form">
                        <div className="profile-field-row">
                            <label htmlFor="lastName">
                                Họ<span className="profile-required">*</span>
                            </label>
                            <input
                                id="lastName"
                                name="lastName"
                                className="profile-field-input"
                                value={user.lastName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="profile-field-row">
                            <label htmlFor="firstName">
                                Tên<span className="profile-required">*</span>
                            </label>
                            <input
                                id="firstName"
                                name="firstName"
                                className="profile-field-input"
                                value={user.firstName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="profile-field-row">
                            <label htmlFor="phone">Số điện thoại</label>
                            <div className="profile-input-with-action">
                                <input
                                    id="phone"
                                    name="phone"
                                    className="profile-field-input"
                                    value={user.phone}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className="profile-input-link"
                                    onClick={() =>
                                        alert("Thay đổi số điện thoại (fake).")
                                    }
                                >
                                    Thay đổi
                                </button>
                            </div>
                        </div>

                        <div className="profile-field-row">
                            <label htmlFor="email">Email</label>
                            <div className="profile-input-with-action">
                                <input
                                    id="email"
                                    name="email"
                                    className="profile-field-input"
                                    value={hasEmail ? user.email : ""}
                                    placeholder={
                                        hasEmail ? "" : "Chưa có email"
                                    }
                                    readOnly={!hasEmail}
                                    onChange={handleChange}
                                />
                                {!hasEmail && (
                                    <button
                                        type="button"
                                        className="profile-input-link"
                                        onClick={() =>
                                            alert("Thêm email (fake).")
                                        }
                                    >
                                        Thêm mới
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="profile-field-row">
                            <span className="profile-field-label">
                                Giới tính
                                <span className="profile-required">*</span>
                            </span>
                            <div className="profile-gender-options">
                                <label className="profile-gender-option">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="Nam"
                                        checked={user.gender === "Nam"}
                                        onChange={handleChange}
                                    />
                                    <span>Nam</span>
                                </label>
                                <label className="profile-gender-option">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="Nữ"
                                        checked={user.gender === "Nữ"}
                                        onChange={handleChange}
                                    />
                                    <span>Nữ</span>
                                </label>
                            </div>
                        </div>

                        <div className="profile-field-row">
                            <span className="profile-field-label">
                                Birthday
                                <span className="profile-required">*</span>
                            </span>
                            <div className="profile-birthday-inputs">
                                <input
                                    name="birthDay"
                                    className="profile-field-input profile-birthday-input"
                                    value={user.birthDay}
                                    onChange={handleChange}
                                    placeholder="Ngày"
                                    inputMode="numeric"
                                    maxLength={2}
                                />
                                <input
                                    name="birthMonth"
                                    className="profile-field-input profile-birthday-input"
                                    value={user.birthMonth}
                                    onChange={handleChange}
                                    placeholder="Tháng"
                                    inputMode="numeric"
                                    maxLength={2}
                                />
                                <input
                                    name="birthYear"
                                    className="profile-field-input profile-birthday-input profile-birthday-input--year"
                                    value={user.birthYear}
                                    onChange={handleChange}
                                    placeholder="Năm"
                                    inputMode="numeric"
                                    maxLength={4}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="patient-profile-save-btn"
                        onClick={handleSave}
                    >
                        Lưu thay đổi
                    </button>
                </div>
            )}
        </PatientLayout>
    );
}

export default Profile;
