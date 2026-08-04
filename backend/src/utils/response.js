// Trả response thành công dạng { success, message, data }
export function successResponse(res, message, data = null, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

// Trả response lỗi dạng { success: false, message }
export function errorResponse(res, message, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}
