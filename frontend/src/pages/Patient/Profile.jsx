import { useState } from "react";
import PatientLayout from "../../components/patient/PatientLayout";
import { GENDER_LABEL, db } from "../../data/patientMock";

function Profile() {
    const account = db.account;

    const [user, setUser] = useState({
        firstName: account.first_name,
        lastName: account.last_name,
        email: account.email,
        phone: account.phone,
        gender: GENDER_LABEL[account.gender] || "Nam",
        dateOfBirth: account.date_of_birth,
        address: account.address,
        avatar: account.avatar,
    });

    const [password, setPassword] = useState({
        current: "",
        next: "",
        confirm: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        alert(
            `Đã lưu (fake):\n${user.lastName} ${user.firstName}\n${user.phone}`
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
            <div className="page-header">
                <div>
                    <h1>Tài khoản cá nhân</h1>
                    <p>Quản lý thông tin tài khoản đăng nhập (users).</p>
                </div>
            </div>

            <div className="profile-page">
                <div className="profile-avatar-card">
                    <img src={user.avatar} alt="Avatar" />
                    <h3>
                        {user.lastName} {user.firstName}
                    </h3>
                    <p>{user.email}</p>
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => alert("Đổi ảnh (fake).")}
                    >
                        Đổi ảnh
                    </button>
                </div>

                <div className="profile-form-card">
                    <h2>Thông tin cá nhân</h2>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Họ</label>
                            <input
                                name="lastName"
                                value={user.lastName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Tên</label>
                            <input
                                name="firstName"
                                value={user.firstName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input value={user.email} disabled />
                        </div>

                        <div className="form-group">
                            <label>Số điện thoại</label>
                            <input
                                name="phone"
                                value={user.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Giới tính</label>
                            <select
                                name="gender"
                                value={user.gender}
                                onChange={handleChange}
                            >
                                <option>Nam</option>
                                <option>Nữ</option>
                                <option>Khác</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Ngày sinh</label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={user.dateOfBirth}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>Địa chỉ</label>
                            <input
                                name="address"
                                value={user.address}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="profile-actions">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSave}
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </div>

            <div className="password-card">
                <h2>Đổi mật khẩu</h2>

                <div className="form-grid">
                    <div className="form-group">
                        <label>Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            value={password.current}
                            onChange={(e) =>
                                setPassword((p) => ({
                                    ...p,
                                    current: e.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="form-group">
                        <label>Mật khẩu mới</label>
                        <input
                            type="password"
                            value={password.next}
                            onChange={(e) =>
                                setPassword((p) => ({
                                    ...p,
                                    next: e.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="form-group">
                        <label>Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            value={password.confirm}
                            onChange={(e) =>
                                setPassword((p) => ({
                                    ...p,
                                    confirm: e.target.value,
                                }))
                            }
                        />
                    </div>
                </div>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handlePassword}
                >
                    Cập nhật mật khẩu
                </button>
            </div>
        </PatientLayout>
    );
}

export default Profile;
