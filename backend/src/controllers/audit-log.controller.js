import auditLogService from "../services/audit-log.service.js";
import {
  auditLogIdSchema,
  queryAuditLogSchema,
} from "../validators/audit-log.validator.js";

class AuditLogController {
  async getAll(req, res, next) {
    try {
      const query = queryAuditLogSchema.parse(req.query);
      const result = await auditLogService.getAll(query);
      return res.status(200).json({
        success: true,
        message: "Lay danh sach Audit Log thanh cong",
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          total_pages: result.total_pages,
        },
        data: result.data,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const id = auditLogIdSchema.parse(req.params.id);
      const data = await auditLogService.getById(id);
      return res.status(200).json({
        success: true,
        message: "Lay chi tiet Audit Log thanh cong",
        data,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export { AuditLogController };
export default new AuditLogController();
