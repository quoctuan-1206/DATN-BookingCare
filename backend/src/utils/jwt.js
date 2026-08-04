import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";

// Sinh access token (thời hạn ngắn)
export function generateAccessToken(payload) {
  return jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn,
  });
}

// Sinh refresh token (thời hạn dài)
export function generateRefreshToken(payload) {
  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });
}

// Xác thực access token
export function verifyAccessToken(token) {
  return jwt.verify(token, jwtConfig.accessSecret);
}

// Xác thực refresh token
export function verifyRefreshToken(token) {
  return jwt.verify(token, jwtConfig.refreshSecret);
}
