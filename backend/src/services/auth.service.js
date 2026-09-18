import {
  findUserByEmail,
  createUser,
  createRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteAllRefreshTokens,
  findUserById,
  createOTP,
  findOTPByEmail,
  markOTPVerified,
  deleteOTPsByEmail,
  updatePassword,
  updateUserProfile,
  changePasswordAndRevokeTokens,
} from "../repositories/auth.repository.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { generateOTP } from "../utils/otp.js";
import prisma from "../config/prisma.js";

const REFRESH_TOKEN_DAYS = 7;
const OTP_EXPIRE_MINUTES = 5;

// Loại bỏ password khỏi object user trước khi trả về client
function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

// Tạo payload nhúng vào JWT (id, email, role)
function buildTokenPayload(user) {
  return {
    id: user.id,
    email: user.email,
    roleId: user.role_id,
    role: user.role?.name || null,
  };
}

// Tính ngày hết hạn refresh token (mặc định 7 ngày)
function getRefreshExpiryDate() {
  return new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
}

// Sinh cặp access + refresh token và lưu refresh token vào DB
async function issueTokens(user) {
  const payload = buildTokenPayload(user);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await createRefreshToken({
    user_id: user.id,
    token: refreshToken,
    expires_at: getRefreshExpiryDate(),
  });

  return { accessToken, refreshToken };
}

// Đăng ký tài khoản mới — luôn gán role Patient
export async function register(userData) {
  const {
    email,
    password,
    first_name,
    last_name,
    phone,
    gender,
    date_of_birth,
    address,
  } = userData;

  // 1. Kiểm tra email đã tồn tại
  const existedUser = await findUserByEmail(email);
  if (existedUser) {
    throw Object.assign(new Error("Email already exists"), { statusCode: 400 });
  }

  // 2. Lấy role Patient từ bảng roles
  const patientRole = await prisma.roles.findUnique({
    where: { name: "Patient" },
  });

  if (!patientRole) {
    throw Object.assign(new Error("Patient role not found"), {
      statusCode: 500,
    });
  }

  // 3. Hash mật khẩu rồi tạo user
  const hashedPassword = await hashPassword(password);

  const user = await createUser({
    email,
    password: hashedPassword,
    first_name,
    last_name,
    phone,
    gender,
    date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
    address,
    role_id: patientRole.id,
    is_active: true,
  });

  // 4. Cấp token ngay sau đăng ký
  const tokens = await issueTokens(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

// Đăng nhập — kiểm tra email/password, trả user + tokens
export async function login(email, password) {
  const user = await findUserByEmail(email);

  // Không phân biệt email sai hay password sai (bảo mật)
  if (!user || !(await comparePassword(password, user.password))) {
    throw Object.assign(new Error("Email or password is incorrect"), {
      statusCode: 401,
    });
  }

  if (!user.is_active) {
    throw Object.assign(new Error("Account has been disabled"), {
      statusCode: 403,
    });
  }

  const tokens = await issueTokens(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

// Làm mới token — xác thực refresh token cũ, cấp cặp token mới (rotation)
export async function refreshToken(oldRefreshToken) {
  if (!oldRefreshToken) {
    throw Object.assign(new Error("Refresh token is required"), {
      statusCode: 400,
    });
  }

  // 1. Kiểm tra refresh token còn trong DB và chưa hết hạn
  const storedToken = await findRefreshToken(oldRefreshToken);
  if (!storedToken) {
    throw Object.assign(new Error("Invalid refresh token"), {
      statusCode: 401,
    });
  }

  // 2. Verify chữ ký JWT
  let decoded;
  try {
    decoded = verifyRefreshToken(oldRefreshToken);
  } catch (error) {
    await deleteRefreshToken(oldRefreshToken);
    throw Object.assign(new Error("Refresh token expired"), {
      statusCode: 401,
    });
  }

  // 3. Kiểm tra user còn tồn tại và đang active
  const user = await findUserById(decoded.id);
  if (!user) {
    throw Object.assign(new Error("User not found"), { statusCode: 401 });
  }

  if (!user.is_active) {
    throw Object.assign(new Error("Account has been disabled"), {
      statusCode: 403,
    });
  }

  // 4. Xóa token cũ, cấp token mới
  await deleteRefreshToken(oldRefreshToken);
  return issueTokens(user);
}

// Đăng xuất 1 thiết bị — xóa 1 refresh token
export async function logout(refreshTokenValue) {
  if (!refreshTokenValue) {
    throw Object.assign(new Error("Refresh token is required"), {
      statusCode: 400,
    });
  }

  await deleteRefreshToken(refreshTokenValue);

  return { message: "Logout successfully" };
}

// Đăng xuất mọi thiết bị — xóa toàn bộ refresh token của user
export async function logoutAll(userId) {
  await deleteAllRefreshTokens(userId);
  return { message: "Logout all devices successfully" };
}

// Quên mật khẩu — tạo OTP (hiện log console, gửi email làm sau)
export async function forgotPassword(email) {
  const user = await findUserByEmail(email);

  // Không lộ việc email có tồn tại hay không
  if (!user) {
    return { message: "If the email exists, an OTP has been sent" };
  }

  const otp = generateOTP();

  await createOTP({
    email,
    otp,
    expires_at: new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000),
  });

  // TODO: gửi email OTP
  console.log(`[OTP] ${email}: ${otp}`);

  return { message: "If the email exists, an OTP has been sent" };
}

// Xác thực OTP quên mật khẩu — đánh dấu verified nếu hợp lệ
export async function verifyOTP(email, otp) {
  const record = await findOTPByEmail(email);

  if (!record) {
    throw Object.assign(new Error("OTP not found"), { statusCode: 400 });
  }

  if (record.verified) {
    throw Object.assign(new Error("OTP already used"), { statusCode: 400 });
  }

  if (record.otp !== otp) {
    throw Object.assign(new Error("OTP is incorrect"), { statusCode: 400 });
  }

  if (record.expires_at < new Date()) {
    throw Object.assign(new Error("OTP expired"), { statusCode: 400 });
  }

  await markOTPVerified(record.id);

  return { message: "OTP verified" };
}

// Đặt lại mật khẩu — yêu cầu OTP đã verified, rồi xóa OTP + logout all
export async function resetPassword(email, newPassword) {
  const record = await findOTPByEmail(email);

  if (!record) {
    throw Object.assign(new Error("OTP not found"), { statusCode: 400 });
  }

  if (!record.verified) {
    throw Object.assign(new Error("OTP has not been verified"), {
      statusCode: 400,
    });
  }

  if (record.expires_at < new Date()) {
    throw Object.assign(new Error("OTP expired"), { statusCode: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw Object.assign(new Error("User not found"), { statusCode: 404 });
  }

  const hashedPassword = await hashPassword(newPassword);
  await updatePassword(user.id, hashedPassword);

  // OTP dùng 1 lần + buộc đăng nhập lại mọi thiết bị
  await deleteOTPsByEmail(email);
  await deleteAllRefreshTokens(user.id);

  return { message: "Password reset successfully" };
}

// Cập nhật thông tin cá nhân của chính tài khoản đang đăng nhập
export async function updateProfile(userId, data) {
  const user = await findUserById(Number(userId));
  if (!user) {
    throw Object.assign(new Error("Không tìm thấy người dùng"), {
      statusCode: 404,
    });
  }

  const profileData = { ...data };
  if (profileData.date_of_birth !== undefined) {
    profileData.date_of_birth = profileData.date_of_birth
      ? new Date(profileData.date_of_birth)
      : null;
  }

  const updatedUser = await updateUserProfile(user.id, profileData);
  return sanitizeUser(updatedUser);
}

// Đổi mật khẩu, yêu cầu xác nhận đúng mật khẩu hiện tại
export async function changePassword(userId, currentPassword, newPassword) {
  const user = await findUserById(Number(userId));
  if (!user) {
    throw Object.assign(new Error("Không tìm thấy người dùng"), {
      statusCode: 404,
    });
  }

  if (!(await comparePassword(currentPassword, user.password))) {
    throw Object.assign(new Error("Mật khẩu hiện tại không đúng"), {
      statusCode: 400,
    });
  }

  if (await comparePassword(newPassword, user.password)) {
    throw Object.assign(new Error("Mật khẩu mới phải khác mật khẩu hiện tại"), {
      statusCode: 400,
    });
  }

  const hashedPassword = await hashPassword(newPassword);
  await changePasswordAndRevokeTokens(user.id, hashedPassword);

  return { message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại" };
}
