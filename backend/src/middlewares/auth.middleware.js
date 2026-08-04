import { verifyAccessToken } from "../utils/jwt.js";
import prisma from "../config/prisma.js";

// Loại bỏ password khỏi object user gắn vào req.user
function stripPassword(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

// Middleware bắt buộc: xác thực Bearer access token, gắn req.user
export async function verifyAccessTokenMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access token is required",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization header",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Account has been disabled",
      });
    }

    req.user = stripPassword(user);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
}

// Middleware tùy chọn: có token thì gắn req.user, không có vẫn cho đi tiếp
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    req.user = user?.is_active ? stripPassword(user) : null;
  } catch (error) {
    req.user = null;
  }

  next();
}
