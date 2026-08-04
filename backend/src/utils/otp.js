// Sinh OTP 6 chữ số ngẫu nhiên
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
