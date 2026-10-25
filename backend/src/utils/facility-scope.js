export function getStaffClinicId(user) {
  if (user?.role?.name !== "STAFF") return null;
  const clinicId = Number(user.clinic_id);
  if (!Number.isInteger(clinicId) || clinicId <= 0) {
    const error = new Error("Bạn chưa được phân công cơ sở làm việc. Vui lòng liên hệ quản trị viên.");
    error.statusCode = 403;
    throw error;
  }
  return clinicId;
}

export function assertStaffClinicAccess(user, clinicId) {
  if (user?.role?.name !== "STAFF") return;
  const assignedClinicId = getStaffClinicId(user);
  if (Number(clinicId) !== assignedClinicId) {
    const error = new Error("Bạn không có quyền truy cập dữ liệu của cơ sở này");
    error.statusCode = 404;
    throw error;
  }
}

export function clinicIdForUser(user, requestedClinicId) {
  if (user?.role?.name === "STAFF") return getStaffClinicId(user);
  return requestedClinicId === undefined ? undefined : Number(requestedClinicId);
}
