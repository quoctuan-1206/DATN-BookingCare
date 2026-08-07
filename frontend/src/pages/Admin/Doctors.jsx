import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import doctorService from "../../services/doctor.service";
import { getApiErrorMessage } from "../../api/axios";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 100 };
      if (keyword.trim()) params.search = keyword.trim();

      const result = await doctorService.getDoctors(params);
      setDoctors(result.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được danh sách bác sĩ"));
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleDelete = async (doctor) => {
    const ok = window.confirm(
      `Vô hiệu hóa tài khoản bác sĩ "${doctor.name}"?`,
    );
    if (!ok) return;

    try {
      await doctorService.deleteDoctor(doctor.id);
      toast.success("Đã vô hiệu hóa bác sĩ");
      fetchDoctors();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không xóa được bác sĩ"));
    }
  };

  return (
    <AdminLayout title="Bác sĩ">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Quản lý bác sĩ</h3>
            <p>Danh sách bác sĩ trên hệ thống</p>
          </div>
          <div className="admin-page-actions">
            <Link
              to="/admin/doctors/create"
              className="admin-btn admin-btn-primary"
            >
              <Plus size={16} />
              Thêm bác sĩ
            </Link>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="admin-toolbar">
            <input
              className="admin-input"
              type="text"
              placeholder="Tìm bác sĩ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setKeyword(search);
              }}
            />
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => setKeyword(search)}
            >
              Tìm
            </button>
          </div>

          <div className="table-wrapper">
            {loading ? (
              <p>Đang tải...</p>
            ) : doctors.length === 0 ? (
              <p>Không có bác sĩ nào.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Bác sĩ</th>
                    <th>Chuyên khoa</th>
                    <th>Phòng khám</th>
                    <th>Giá khám</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td>
                        <div className="table-user">
                          <img
                            className="table-avatar"
                            src={doctor.avatar}
                            alt={doctor.name}
                          />
                          <div className="table-user-info">
                            <strong>{doctor.name}</strong>
                            <span>{doctor.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>{doctor.specialty}</td>
                      <td>{doctor.clinic}</td>
                      <td>
                        {Number(doctor.consultation_fee || 0).toLocaleString(
                          "vi-VN",
                        )}{" "}
                        đ
                      </td>
                      <td>
                        <span
                          className={`status ${
                            doctor.is_active ? "confirmed" : "cancelled"
                          }`}
                        >
                          {doctor.is_active ? "Hoạt động" : "Tạm khóa"}
                        </span>
                      </td>
                      <td style={{ display: "flex", gap: 8 }}>
                        <Link
                          to={`/doctors/${doctor.id}`}
                          className="admin-btn admin-btn-secondary"
                        >
                          Xem
                        </Link>
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          onClick={() => handleDelete(doctor)}
                        >
                          Khóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default Doctors;
