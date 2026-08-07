import userRepository from "../repositories/user.repository.js";

class UserService {
  // Chuẩn hóa dữ liệu người dùng trả về API
  formatUserResponse(user) {
    if (!user) return null;

    const fullName = [user.last_name, user.first_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: fullName || user.email,
      phone: user.phone || null,
      gender: user.gender || null,
      date_of_birth: user.date_of_birth || null,
      address: user.address || null,
      avatar:
        user.avatar ||
        `https://i.pravatar.cc/150?u=${user.id}`,
      role: user.role?.name || null,
      role_id: user.role?.id || null,
      role_description: user.role?.description || null,
      is_active: user.is_active !== false,
      created_at: user.created_at,
      updated_at: user.updated_at,
      doctor_profile: user.doctor_profiles || null,
      patient_profiles: user.patient_profiles || [],
    };
  }

  // Validate id là số nguyên dương
  parseId(id) {
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
      const error = new Error("ID người dùng không hợp lệ");
      error.statusCode = 400;
      throw error;
    }
    return userId;
  }

  // Danh sách người dùng (Admin)
  async getAllUsers(queryParams) {
    const { total, users, page, limit } =
      await userRepository.findAll(queryParams);

    return {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit) || 0,
      data: users.map((u) => this.formatUserResponse(u)),
    };
  }

  // Chi tiết người dùng (Admin)
  async getUserById(id) {
    const userId = this.parseId(id);
    const user = await userRepository.findById(userId);

    if (!user) {
      const error = new Error("Không tìm thấy người dùng");
      error.statusCode = 404;
      throw error;
    }

    return this.formatUserResponse(user);
  }

  // Khóa / mở khóa tài khoản (Admin)
  async updateUserStatus(id, isActive, currentAdminId) {
    const userId = this.parseId(id);
    const user = await userRepository.findById(userId);

    if (!user) {
      const error = new Error("Không tìm thấy người dùng");
      error.statusCode = 404;
      throw error;
    }

    // Không cho admin tự khóa chính mình
    if (userId === Number(currentAdminId) && isActive === false) {
      const error = new Error("Bạn không thể khóa tài khoản của chính mình");
      error.statusCode = 400;
      throw error;
    }

    const currentlyActive = user.is_active !== false;

    if (currentlyActive === isActive) {
      const error = new Error(
        isActive
          ? "Tài khoản đang hoạt động"
          : "Tài khoản đã bị khóa",
      );
      error.statusCode = 400;
      throw error;
    }

    const updated = await userRepository.updateStatus(userId, isActive);
    return this.formatUserResponse(updated);
  }
}

export default new UserService();
