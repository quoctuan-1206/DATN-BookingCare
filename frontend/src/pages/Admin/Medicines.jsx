import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import medicineService from "../../services/medicine.service";
import { getApiErrorMessage } from "../../api/axios";

function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 200 };
      if (keyword.trim()) params.search = keyword.trim();

      const result = await medicineService.getMedicines(params);
      setMedicines(result.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được danh sách thuốc"));
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const handleDelete = async (item) => {
    const ok = window.confirm(`Xóa thuốc "${item.name}"?`);
    if (!ok) return;

    try {
      await medicineService.delete(item.id);
      toast.success("Đã xóa thuốc");
      fetchMedicines();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không xóa được thuốc"));
    }
  };

  return (
    <AdminLayout title="Thuốc">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Quản lý thuốc</h3>
            <p>Danh mục thuốc để bác sĩ kê đơn khi khám bệnh</p>
          </div>
          <div className="admin-page-actions">
            <Link
              to="/admin/medicines/create"
              className="admin-btn admin-btn-primary"
            >
              <Plus size={16} />
              Thêm thuốc
            </Link>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="admin-toolbar">
            <input
              className="admin-input"
              type="text"
              placeholder="Tìm tên thuốc..."
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
            ) : medicines.length === 0 ? (
              <p>
                Chưa có thuốc nào.{" "}
                <Link to="/admin/medicines/create">Thêm thuốc đầu tiên</Link>
              </p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tên thuốc</th>
                    <th>Đơn vị</th>
                    <th>Giá</th>
                    <th>Mô tả</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>{item.unit || "—"}</td>
                      <td>
                        {Number(item.price || 0).toLocaleString("vi-VN")} đ
                      </td>
                      <td>{item.description || "—"}</td>
                      <td style={{ display: "flex", gap: 8 }}>
                        <Link
                          to={`/admin/medicines/${item.id}/edit`}
                          className="admin-btn admin-btn-primary"
                        >
                          Sửa
                        </Link>
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          onClick={() => handleDelete(item)}
                        >
                          Xóa
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

export default Medicines;
