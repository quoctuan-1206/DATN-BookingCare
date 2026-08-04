export function authorize(...allowedRoles) {
  // Middleware phân quyền theo tên role (Admin, Doctor, Patient, ...)
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const roleName = req.user.role?.name;

    if (!roleName || !allowedRoles.includes(roleName)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    next();
  };
}
