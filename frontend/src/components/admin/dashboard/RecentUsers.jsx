import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import userService from "../../../services/user.service";

function getRoleName(role) {
  if (!role) return "Patient";
  if (typeof role === "string") return role;
  return role.name || "Patient";
}

function renderRole(role) {
  const name = getRoleName(role);
  const key = name.toLowerCase();

  if (key === "admin") {
    return <span className="role admin">Admin</span>;
  }
  if (key === "doctor") {
    return <span className="role doctor">Bác sĩ</span>;
  }
  return <span className="role patient">Bệnh nhân</span>;
}

function RecentUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const result = await userService.getUsers({ page: 1, limit: 6 });
        if (alive) setUsers(result.data || []);
      } catch {
        if (alive) setUsers([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <h3>Người dùng mới</h3>
        <Link to="/admin/users" className="view-all">
          Xem tất cả
        </Link>
      </div>

      <div className="recent-users">
        {loading ? (
          <p>Đang tải...</p>
        ) : users.length === 0 ? (
          <p>Chưa có người dùng.</p>
        ) : (
          users.map((user) => (
            <Link
              key={user.id}
              to={`/admin/users/${user.id}`}
              className="recent-user-item"
            >
              <img src={user.avatar} alt={user.name} />
              <div className="recent-user-info">
                <h4>{user.name || "—"}</h4>
                <p>{user.email}</p>
              </div>
              {renderRole(user.role)}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default RecentUsers;
