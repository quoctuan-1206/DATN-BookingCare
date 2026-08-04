import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!accessSecret || !refreshSecret) {
  throw new Error(
    "Thiếu JWT_ACCESS_SECRET hoặc JWT_REFRESH_SECRET trong file backend/.env",
  );
}

export const jwtConfig = {
  accessSecret,
  refreshSecret,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
};
