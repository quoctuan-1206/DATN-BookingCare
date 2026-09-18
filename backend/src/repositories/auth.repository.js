import prisma from "../config/prisma.js";

// Tìm user theo email (kèm role)
export async function findUserByEmail(email) {
  return prisma.users.findUnique({
    where: { email },
    include: { role: true },
  });
}

// Tìm user theo id (kèm role)
export async function findUserById(id) {
  return prisma.users.findUnique({
    where: { id },
    include: { role: true },
  });
}

// Tạo user mới trong bảng users
export async function createUser(data) {
  return prisma.users.create({
    data,
    include: { role: true },
  });
}

// Cập nhật mật khẩu đã hash cho user
export async function updatePassword(userId, password) {
  return prisma.users.update({
    where: { id: userId },
    data: { password },
  });
}

// Đổi mật khẩu và thu hồi toàn bộ phiên đăng nhập trong cùng giao dịch
export async function changePasswordAndRevokeTokens(userId, password) {
  return prisma.$transaction([
    prisma.users.update({
      where: { id: Number(userId) },
      data: { password, updated_at: new Date() },
    }),
    prisma.refresh_tokens.deleteMany({
      where: { user_id: Number(userId) },
    }),
  ]);
}

// Cập nhật thông tin cơ bản của tài khoản
export async function updateUserProfile(userId, data) {
  return prisma.users.update({
    where: { id: Number(userId) },
    data: {
      ...data,
      updated_at: new Date(),
    },
    include: { role: true },
  });
}

// Lưu refresh token vào bảng refresh_tokens
export async function createRefreshToken(data) {
  return prisma.refresh_tokens.create({ data });
}

// Tìm refresh token còn hiệu lực (chưa hết hạn theo expires_at)
export async function findRefreshToken(token) {
  return prisma.refresh_tokens.findFirst({
    where: {
      token,
      expires_at: { gt: new Date() },
    },
  });
}

// Xóa 1 refresh token (logout 1 thiết bị)
export async function deleteRefreshToken(token) {
  return prisma.refresh_tokens.deleteMany({
    where: { token },
  });
}

// Xóa toàn bộ refresh token của 1 user (logout all)
export async function deleteAllRefreshTokens(userId) {
  return prisma.refresh_tokens.deleteMany({
    where: { user_id: userId },
  });
}

// Tạo OTP mới — xóa OTP cũ của email trước khi tạo
export async function createOTP(data) {
  await prisma.otp_verifications.deleteMany({
    where: { email: data.email },
  });

  return prisma.otp_verifications.create({ data });
}

// Lấy OTP mới nhất theo email
export async function findOTPByEmail(email) {
  return prisma.otp_verifications.findFirst({
    where: { email },
    orderBy: { created_at: "desc" },
  });
}

// Đánh dấu 1 OTP đã xác thực thành công
export async function markOTPVerified(id) {
  return prisma.otp_verifications.update({
    where: { id },
    data: { verified: true },
  });
}

// Xóa toàn bộ OTP của email (sau khi reset password)
export async function deleteOTPsByEmail(email) {
  return prisma.otp_verifications.deleteMany({
    where: { email },
  });
}
