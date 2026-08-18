class UploadController {
  // Tải ảnh lên máy chủ (POST /api/upload)
  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng chọn ảnh để tải lên",
        });
      }

      return res.status(201).json({
        success: true,
        message: "Tải ảnh thành công",
        data: {
          url: `/uploads/${req.file.filename}`,
          filename: req.file.filename,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UploadController();
