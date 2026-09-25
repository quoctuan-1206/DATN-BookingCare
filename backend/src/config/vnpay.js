const REQUIRED_KEYS = ["VNPAY_TMN_CODE", "VNPAY_HASH_SECRET", "VNPAY_RETURN_URL", "VNPAY_IPN_URL", "FRONTEND_URL"];

export function getVnpayConfig(env = process.env) {
  for (const key of REQUIRED_KEYS) {
    if (!env[key]) throw new Error(`Missing required VNPAY configuration: ${key}`);
  }
  return {
    tmnCode: env.VNPAY_TMN_CODE,
    hashSecret: env.VNPAY_HASH_SECRET,
    paymentUrl: env.VNPAY_PAYMENT_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    returnUrl: env.VNPAY_RETURN_URL,
    ipnUrl: env.VNPAY_IPN_URL,
    frontendUrl: env.FRONTEND_URL.replace(/\/$/, ""),
  };
}
