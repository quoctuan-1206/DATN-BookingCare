import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import clinicService from "../../services/clinic.service";
import { getApiErrorMessage } from "../../api/axios";

function Clinics() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");

  const fetchClinics = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 100 };
      if (keyword.trim()) params.search = keyword.trim();

      const result = await clinicService.getClinics(params);
      setClinics(result.data);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không tải được danh sách phòng khám"),
      );
      setClinics([]);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  const handleDelete = async (clinic) => {
    const ok = window.confirm(
      `Vô hiệu hóa phòng khám "${clinic.name}"?`,
    );
    if (!ok) return;

    try {
      await clinicService.deleteClinic(clinic.id);
      toast.success("Đã vô hiệu hóa phòng khám");
      fetchClinics();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không xóa được phòng khám"));
    }
  };

  return (
    <AdminLayout title="Phòng khám">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Quản lý phòng khám</h3>
            <p>Danh sách phòng khám trên hệ thống</p>
          </div>
          <div className="admin-page-actions">
            <Link
              to="/admin/clinics/create"
              className="admin-btn admin-btn-primary"
            >
              <Plus size={16} />
              Thêm phòng khám
            </Link>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="admin-toolbar">
            <input
              className="admin-input"
              type="text"
              placeholder="Tìm phòng khám..."
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
            ) : clinics.length === 0 ? (
              <p>Không có phòng khám nào.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tên phòng khám</th>
                    <th>Địa chỉ</th>
                    <th>Điện thoại</th>
                    <th>Số bác sĩ</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {clinics.map((clinic) => (
                    <tr key={clinic.id}>
                      <td>
                        <strong>{clinic.name}</strong>
                      </td>
                      <td>{clinic.address}</td>
                      <td>{clinic.phone || "—"}</td>
                      <td>{clinic.doctor_count}</td>
                      <td>
                        <span
                          className={`status ${
                            clinic.is_active ? "confirmed" : "cancelled"
                          }`}
                        >
                          {clinic.is_active ? "Hoạt động" : "Tạm khóa"}
                        </span>
                      </td>
                      <td style={{ display: "flex", gap: 8 }}>
                        <Link
                          to={`/clinics/${clinic.id}`}
                          className="admin-btn admin-btn-secondary"
                        >
                          Xem
                        </Link>
                        <Link
                          to={`/admin/clinics/${clinic.id}/edit`}
                          className="admin-btn admin-btn-primary"
                        >
                          Sửa
                        </Link>
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          onClick={() => handleDelete(clinic)}
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

export default Clinics;
