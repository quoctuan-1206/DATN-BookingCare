import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import specialtyService from "../../services/specialty.service";
import { getApiErrorMessage } from "../../api/axios";

function Specialties() {
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");

  const fetchSpecialties = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 100 };
      if (keyword.trim()) params.search = keyword.trim();

      const result = await specialtyService.getSpecialties(params);
      setSpecialties(result.data);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không tải được danh sách chuyên khoa"),
      );
      setSpecialties([]);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  const handleDelete = async (item) => {
    const ok = window.confirm(
      `Vô hiệu hóa chuyên khoa "${item.name}"?`,
    );
    if (!ok) return;

    try {
      await specialtyService.deleteSpecialty(item.id);
      toast.success("Đã vô hiệu hóa chuyên khoa");
      fetchSpecialties();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không xóa được chuyên khoa"));
    }
  };

  return (
    <AdminLayout title="Chuyên khoa">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Quản lý chuyên khoa</h3>
            <p>Danh sách chuyên khoa trên hệ thống</p>
          </div>
          <div className="admin-page-actions">
            <Link
              to="/admin/specialties/create"
              className="admin-btn admin-btn-primary"
            >
              <Plus size={16} />
              Thêm chuyên khoa
            </Link>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="admin-toolbar">
            <input
              className="admin-input"
              type="text"
              placeholder="Tìm chuyên khoa..."
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
            ) : specialties.length === 0 ? (
              <p>Không có chuyên khoa nào.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tên chuyên khoa</th>
                    <th>Số bác sĩ</th>
                    <th>Số phòng khám</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {specialties.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>{item.doctor_count}</td>
                      <td>{item.clinic_count}</td>
                      <td>
                        <span
                          className={`status ${
                            item.is_active ? "confirmed" : "cancelled"
                          }`}
                        >
                          {item.is_active ? "Hoạt động" : "Tạm khóa"}
                        </span>
                      </td>
                      <td style={{ display: "flex", gap: 8 }}>
                        <Link
                          to={`/specialties/${item.id}`}
                          className="admin-btn admin-btn-secondary"
                        >
                          Xem
                        </Link>
                        <Link
                          to={`/admin/specialties/${item.id}/edit`}
                          className="admin-btn admin-btn-primary"
                        >
                          Sửa
                        </Link>
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          onClick={() => handleDelete(item)}
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

export default Specialties;
