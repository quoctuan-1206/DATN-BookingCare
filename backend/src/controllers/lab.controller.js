import fs from "fs";
import path from "path";
import labService from "../services/lab.service.js";
import {
  CLINICAL_RESULT_DIR,
  LAB_RESULT_DIR,
} from "../middlewares/upload.middleware.js";
import {
  createClinicalOrderSchema,
  createPatientClinicalOrderSchema,
  createClinicalResultSchema,
  createClinicalScheduleSchema,
  createClinicalServiceSchema,
  createLabOrderSchema,
  createPatientLabOrderSchema,
  createLabScheduleSchema,
  createLabTestSchema,
  queryClinicalServiceSchema,
  queryClinicalAvailableScheduleSchema,
  queryLabOrderSchema,
  queryLabScheduleSchema,
  queryLabTestSchema,
  updateClinicalOrderStatusSchema,
  updateClinicalResultSchema,
  updateClinicalScheduleSchema,
  updateClinicalServiceSchema,
  updateLabOrderStatusSchema,
  updateLabResultSchema,
  updateLabScheduleSchema,
  updateLabTestSchema,
} from "../validators/lab.validator.js";

function readHeader(file, length = 16) {
  const descriptor = fs.openSync(file.path, "r");
  const header = Buffer.alloc(length);
  try {
    fs.readSync(descriptor, header, 0, header.length, 0);
  } finally {
    fs.closeSync(descriptor);
  }
  return header;
}

function hasValidDocumentSignature(file) {
  const header = readHeader(file, 8);
  const extension = path.extname(file.originalname || "").toLowerCase();
  if (extension === ".pdf") return header.subarray(0, 4).toString() === "%PDF";
  if (extension === ".docx") return header[0] === 0x50 && header[1] === 0x4b;
  if (extension === ".doc") {
    return header.equals(
      Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
    );
  }
  return false;
}

function hasValidClinicalSignature(file) {
  const header = readHeader(file, 16);
  const extension = path.extname(file.originalname || "").toLowerCase();
  if ([".pdf", ".doc", ".docx"].includes(extension)) {
    return hasValidDocumentSignature(file);
  }
  if ([".jpg", ".jpeg"].includes(extension)) {
    return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  }
  if (extension === ".png") {
    return header.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }
  if (extension === ".gif") {
    return ["GIF87a", "GIF89a"].includes(header.subarray(0, 6).toString());
  }
  if (extension === ".webp") {
    return (
      header.subarray(0, 4).toString() === "RIFF" &&
      header.subarray(8, 12).toString() === "WEBP"
    );
  }
  if (extension === ".mp4") {
    return header.subarray(4, 8).toString() === "ftyp";
  }
  if (extension === ".webm") {
    return header.subarray(0, 4).equals(
      Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
    );
  }
  return false;
}

function sanitizeUpload(file) {
  return {
    originalName: path
      .basename(file.originalname)
      .replace(/[\\/\r\n"]/g, "_")
      .slice(0, 255),
    filename: path.basename(file.filename),
    mimeType: file.mimetype,
    size: file.size,
  };
}

function unlinkUploadedFile(filePath) {
  if (filePath) fs.promises.unlink(filePath).catch(() => {});
}

function paginationOf(result) {
  return {
    total: result.total,
    page: result.page,
    limit: result.limit,
    total_pages: result.total_pages,
  };
}

function sendPrivateFile(res, file, directory, { allowInline = false } = {}) {
  const absolutePath = path.join(directory, path.basename(file.path));
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({
      success: false,
      message: "File kết quả không còn tồn tại trên máy chủ",
    });
  }
  res.type(file.type);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'");
  const canRenderInline =
    file.type?.startsWith("image/") ||
    file.type?.startsWith("video/") ||
    file.type === "application/pdf";
  if (allowInline && canRenderInline) {
    const encodedName = encodeURIComponent(path.basename(file.name));
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodedName}`);
    return res.sendFile(absolutePath);
  }
  return res.download(absolutePath, file.name);
}

async function respondOrders(
  req,
  res,
  next,
  forcedServiceType = null,
  extraQuery = {},
) {
  try {
    const result = await labService.getOrders(
      queryLabOrderSchema.parse({ ...req.query, ...extraQuery }),
      req.user,
      forcedServiceType,
    );
    res.json({
      success: true,
      message:
        forcedServiceType === "LAB"
          ? "Lấy danh sách phiếu xét nghiệm thành công"
          : "Lấy danh sách phiếu cận lâm sàng thành công",
      pagination: paginationOf(result),
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
}

class LabController {
  async getPublicTests(req, res, next) {
    try {
      const query = queryLabTestSchema.parse(req.query);
      const data = await labService.getTests(
        { ...query, is_active: true, booking_mode: "SELF_BOOKING" },
        "LAB",
      );
      res.json({ success: true, message: "Lấy danh mục xét nghiệm thành công", data });
    } catch (error) {
      next(error);
    }
  }

  async getPublicTestById(req, res, next) {
    try {
      const data = await labService.getTestById(
        req.params.id,
        true,
        "LAB",
        "SELF_BOOKING",
      );
      res.json({ success: true, message: "Lấy chi tiết gói xét nghiệm thành công", data });
    } catch (error) {
      next(error);
    }
  }

  async getPublicServices(req, res, next) {
    try {
      const query = queryLabTestSchema.parse(req.query);
      const data = await labService.getTests({ ...query, is_active: true });
      res.json({
        success: true,
        message: "Lấy danh mục cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPublicServiceById(req, res, next) {
    try {
      const data = await labService.getTestById(req.params.id, true);
      res.json({
        success: true,
        message: "Lấy chi tiết dịch vụ cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableSchedules(req, res, next) {
    try {
      const result = await labService.getSchedules(
        queryLabScheduleSchema.parse(req.query),
        true,
        "LAB",
      );
      res.json({
        success: true,
        message: "Lấy lịch xét nghiệm còn chỗ thành công",
        pagination: paginationOf(result),
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableClinicalSchedules(req, res, next) {
    try {
      const result = await labService.getSchedules(
        queryClinicalAvailableScheduleSchema.parse(req.query),
        true,
      );
      res.json({
        success: true,
        message: "Lấy lịch cận lâm sàng còn chỗ thành công",
        pagination: paginationOf(result),
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTests(req, res, next) {
    try {
      const data = await labService.getTests(
        queryLabTestSchema.parse(req.query),
        "LAB",
      );
      res.json({ success: true, message: "Lấy danh mục xét nghiệm thành công", data });
    } catch (error) {
      next(error);
    }
  }

  async createTest(req, res, next) {
    try {
      const data = await labService.createTest(
        createLabTestSchema.parse(req.body),
        "LAB",
      );
      res.status(201).json({ success: true, message: "Tạo xét nghiệm thành công", data });
    } catch (error) {
      next(error);
    }
  }

  async updateTest(req, res, next) {
    try {
      const data = await labService.updateTest(
        req.params.id,
        updateLabTestSchema.parse(req.body),
        "LAB",
      );
      res.json({ success: true, message: "Cập nhật xét nghiệm thành công", data });
    } catch (error) {
      next(error);
    }
  }

  async deleteTest(req, res, next) {
    try {
      const data = await labService.deleteService(req.params.id, "LAB");
      res.json({ success: true, message: "Ngừng hoạt động xét nghiệm thành công", data });
    } catch (error) {
      next(error);
    }
  }

  async getServices(req, res, next) {
    try {
      const result = await labService.getServices(
        queryClinicalServiceSchema.parse(req.query),
      );
      res.json({
        success: true,
        message: "Lấy danh sách dịch vụ cận lâm sàng thành công",
        pagination: paginationOf(result),
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getClinicalStatistics(req, res, next) {
    try {
      const data = await labService.getClinicalStatistics(req.user);
      res.json({
        success: true,
        message: "Lấy thống kê cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async createService(req, res, next) {
    try {
      const data = await labService.createService(
        createClinicalServiceSchema.parse(req.body),
      );
      res.status(201).json({
        success: true,
        message: "Tạo dịch vụ cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getServiceById(req, res, next) {
    try {
      const data = await labService.getTestById(req.params.id);
      res.json({
        success: true,
        message: "Lấy chi tiết dịch vụ cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateService(req, res, next) {
    try {
      const data = await labService.updateService(
        req.params.id,
        updateClinicalServiceSchema.parse(req.body),
      );
      res.json({
        success: true,
        message: "Cập nhật dịch vụ cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteService(req, res, next) {
    try {
      const data = await labService.deleteService(req.params.id);
      res.json({
        success: true,
        message: "Ngừng hoạt động dịch vụ cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSchedules(req, res, next) {
    try {
      const result = await labService.getSchedules(
        queryLabScheduleSchema.parse(req.query),
        false,
        "LAB",
      );
      res.json({
        success: true,
        message: "Lấy danh sách lịch xét nghiệm thành công",
        pagination: paginationOf(result),
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  async createSchedule(req, res, next) {
    try {
      const data = await labService.createSchedule(
        createLabScheduleSchema.parse(req.body),
      );
      res.status(201).json({ success: true, message: "Tạo lịch xét nghiệm thành công", data });
    } catch (error) {
      next(error);
    }
  }

  async updateSchedule(req, res, next) {
    try {
      const data = await labService.updateSchedule(
        req.params.id,
        updateLabScheduleSchema.parse(req.body),
      );
      res.json({ success: true, message: "Cập nhật lịch xét nghiệm thành công", data });
    } catch (error) {
      next(error);
    }
  }

  async deleteSchedule(req, res, next) {
    try {
      const data = await labService.deleteSchedule(req.params.id);
      res.json({ success: true, message: "Xóa lịch xét nghiệm thành công", data });
    } catch (error) {
      next(error);
    }
  }

  async getClinicalSchedules(req, res, next) {
    try {
      const result = await labService.getSchedules(
        queryLabScheduleSchema.parse(req.query),
      );
      res.json({
        success: true,
        message: "Lấy danh sách lịch cận lâm sàng thành công",
        pagination: paginationOf(result),
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  async createClinicalSchedule(req, res, next) {
    try {
      const data = await labService.createSchedule(
        createClinicalScheduleSchema.parse(req.body),
        null,
      );
      res.status(201).json({
        success: true,
        message: "Tạo lịch cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateClinicalSchedule(req, res, next) {
    try {
      const data = await labService.updateSchedule(
        req.params.id,
        updateClinicalScheduleSchema.parse(req.body),
        null,
      );
      res.json({
        success: true,
        message: "Cập nhật lịch cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteClinicalSchedule(req, res, next) {
    try {
      const data = await labService.deleteSchedule(req.params.id, null);
      res.json({
        success: true,
        message: "Xóa lịch cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async createOrder(req, res, next) {
    try {
      const data = await labService.createOrder(
        createLabOrderSchema.parse(req.body),
        req.user,
        "LAB",
      );
      res.status(201).json({ success: true, message: "Chỉ định xét nghiệm thành công", data });
    } catch (error) {
      next(error);
    }
  }

  async createClinicalOrder(req, res, next) {
    try {
      const data = await labService.createOrder(
        createClinicalOrderSchema.parse(req.body),
        req.user,
      );
      res.status(201).json({
        success: true,
        message: "Tạo phiếu chỉ định cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async createPatientOrder(req, res, next) {
    try {
      const payload = createPatientLabOrderSchema.parse(req.body);
      const data = await labService.createPatientOrder(payload, req.user, "LAB");
      res.status(201).json({ success: true, message: "Đặt xét nghiệm thành công", data });
    } catch (error) {
      next(error);
    }
  }

  async createPatientClinicalOrder(req, res, next) {
    try {
      const payload = createPatientClinicalOrderSchema.parse(req.body);
      const data = await labService.createPatientOrder(payload, req.user, null);
      res.status(201).json({
        success: true,
        message: "Đặt lịch cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  getOrders(req, res, next) {
    return respondOrders(req, res, next, "LAB");
  }

  getClinicalOrders(req, res, next) {
    return respondOrders(req, res, next);
  }

  getPatientHistory(req, res, next) {
    return respondOrders(req, res, next, null, {
      patient_id: req.params.patientId,
    });
  }

  getAppointmentHistory(req, res, next) {
    return respondOrders(req, res, next, null, {
      appointment_id: req.params.appointmentId,
    });
  }

  getDoctorHistory(req, res, next) {
    return respondOrders(req, res, next, null, {
      doctor_id: req.params.doctorId,
    });
  }

  getStatusHistory(req, res, next) {
    return respondOrders(req, res, next, null, {
      status: req.params.status,
    });
  }

  async getOrderById(req, res, next) {
    try {
      const data = await labService.getOrderById(req.params.id, req.user, "LAB");
      res.json({ success: true, message: "Lấy phiếu xét nghiệm thành công", data });
    } catch (error) {
      next(error);
    }
  }

  async getClinicalOrderById(req, res, next) {
    try {
      const data = await labService.getOrderById(req.params.id, req.user);
      res.json({
        success: true,
        message: "Lấy phiếu cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const payload = updateLabOrderStatusSchema.parse(req.body);
      const data = await labService.updateOrderStatus(
        req.params.id,
        payload,
        req.user,
        "LAB",
      );
      res.json({ success: true, message: "Cập nhật trạng thái thành công", data });
    } catch (error) {
      next(error);
    }
  }

  async updateClinicalOrderStatus(req, res, next) {
    try {
      const payload = updateClinicalOrderStatusSchema.parse(req.body);
      const data = await labService.updateOrderStatus(
        req.params.id,
        payload,
        req.user,
      );
      res.json({
        success: true,
        message: "Cập nhật trạng thái phiếu cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateResult(req, res, next) {
    try {
      const payload = updateLabResultSchema.parse(req.body);
      const data = await labService.updateResult(
        req.params.orderId,
        req.params.resultId,
        payload,
        req.user,
        { forcedServiceType: "LAB", autoComplete: true },
      );
      res.json({ success: true, message: "Lưu kết quả xét nghiệm thành công", data });
    } catch (error) {
      next(error);
    }
  }

  async createClinicalResult(req, res, next) {
    try {
      const data = await labService.createResult(
        req.params.orderId,
        createClinicalResultSchema.parse(req.body),
        req.user,
      );
      res.status(201).json({
        success: true,
        message: "Lưu kết quả cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getClinicalResult(req, res, next) {
    try {
      const data = await labService.getResultById(req.params.id, req.user);
      res.json({
        success: true,
        message: "Lấy kết quả cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateClinicalResult(req, res, next) {
    try {
      const data = await labService.updateResult(
        req.params.orderId,
        req.params.resultId,
        updateClinicalResultSchema.parse(req.body),
        req.user,
      );
      res.json({
        success: true,
        message: "Cập nhật kết quả cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadResultFile(req, res, next) {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn file kết quả xét nghiệm",
      });
    }

    try {
      if (!hasValidDocumentSignature(req.file)) {
        unlinkUploadedFile(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Nội dung file không đúng định dạng PDF, DOC hoặc DOCX",
        });
      }
      const result = await labService.attachResultFile(
        req.params.id,
        sanitizeUpload(req.file),
        req.user,
      );
      if (result.previousFilePath) {
        unlinkUploadedFile(
          path.join(LAB_RESULT_DIR, path.basename(result.previousFilePath)),
        );
      }
      return res.status(201).json({
        success: true,
        message: "Tải file kết quả xét nghiệm thành công",
        data: result.data,
      });
    } catch (error) {
      unlinkUploadedFile(req.file.path);
      next(error);
    }
  }

  async downloadResultFile(req, res, next) {
    try {
      const file = await labService.getResultFile(req.params.id, req.user);
      return sendPrivateFile(res, file, LAB_RESULT_DIR);
    } catch (error) {
      next(error);
    }
  }

  async uploadAttachment(req, res, next) {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn file cận lâm sàng",
      });
    }
    try {
      if (!hasValidClinicalSignature(req.file)) {
        unlinkUploadedFile(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Nội dung file không đúng định dạng được hỗ trợ",
        });
      }
      const data = await labService.addAttachment(
        req.params.id,
        sanitizeUpload(req.file),
        req.user,
      );
      return res.status(201).json({
        success: true,
        message: "Tải tệp cận lâm sàng thành công",
        data,
      });
    } catch (error) {
      unlinkUploadedFile(req.file.path);
      next(error);
    }
  }

  async getAttachments(req, res, next) {
    try {
      const data = await labService.getAttachments(req.params.id, req.user);
      res.json({ success: true, message: "Lấy danh sách tệp thành công", data });
    } catch (error) {
      next(error);
    }
  }

  async downloadAttachment(req, res, next) {
    try {
      const file = await labService.getAttachmentFile(req.params.id, req.user);
      return sendPrivateFile(res, file, CLINICAL_RESULT_DIR, {
        allowInline: req.query.download !== "true",
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAttachment(req, res, next) {
    try {
      const deleted = await labService.deleteAttachment(req.params.id, req.user);
      unlinkUploadedFile(
        path.join(CLINICAL_RESULT_DIR, path.basename(deleted.storagePath)),
      );
      res.json({
        success: true,
        message: "Xóa tệp đính kèm thành công",
        data: { id: deleted.id },
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderEvents(req, res, next) {
    try {
      const data = await labService.getOrderEvents(req.params.id, req.user);
      res.json({ success: true, message: "Lấy lịch sử phiếu thành công", data });
    } catch (error) {
      next(error);
    }
  }
}

export default new LabController();
