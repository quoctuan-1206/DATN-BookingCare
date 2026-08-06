import userService from "../services/user.service.js";
import {
  queryUserSchema,
  updateUserStatusSchema,
} from "../validators/user.validator.js";

class UserController {
  // Danh sách người dùng (GET /api/users)
  async getAllUsers(req, res, next) {
    try {
      const validatedQuery = queryUserSchema.parse(req.query);
      const result = await userService.getAllUsers(validatedQuery);

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách người dùng thành công",
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          total_pages: result.total_pages,
        },
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  // Chi tiết người dùng (GET /api/users/:id)
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      return res.status(200).json({
        success: true,
        message: "Lấy thông tin người dùng thành công",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // Khóa / mở khóa (PATCH /api/users/:id/status)
  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { is_active } = updateUserStatusSchema.parse(req.body);
      const updated = await userService.updateUserStatus(
        id,
        is_active,
        req.user.id,
      );

      return res.status(200).json({
        success: true,
        message: is_active
          ? "Đã mở khóa tài khoản"
          : "Đã khóa tài khoản",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
