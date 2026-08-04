import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

// Hash mật khẩu bằng bcrypt
export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// So sánh mật khẩu thô với hash đã lưu
export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}
