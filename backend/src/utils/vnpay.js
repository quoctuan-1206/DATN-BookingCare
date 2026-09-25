import crypto from "node:crypto";

/**
 * Format a Date to YYYYMMDDHHmmss in Vietnam time (GMT+7).
 *
 * @param {Date|string|number} [date=new Date()]
 * @returns {string} Formatted timestamp string
 */
export function toVnpayDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date provided to toVnpayDate");
  }
  const vnTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const YYYY = vnTime.getUTCFullYear();
  const MM = String(vnTime.getUTCMonth() + 1).padStart(2, "0");
  const DD = String(vnTime.getUTCDate()).padStart(2, "0");
  const HH = String(vnTime.getUTCHours()).padStart(2, "0");
  const mm = String(vnTime.getUTCMinutes()).padStart(2, "0");
  const ss = String(vnTime.getUTCSeconds()).padStart(2, "0");
  return `${YYYY}${MM}${DD}${HH}${mm}${ss}`;
}

/**
 * Generate a deterministic transaction reference format for VNPAY.
 *
 * @param {number|string} invoiceId
 * @param {Date|string|number} [now=new Date()]
 * @param {Function} [randomBytes=crypto.randomBytes]
 * @returns {string} e.g. INV4220260925093000A1B2C3
 */
export function createTxnRef(invoiceId, now = new Date(), randomBytes = crypto.randomBytes) {
  return `INV${invoiceId}${toVnpayDate(now)}${randomBytes(3).toString("hex").toUpperCase()}`;
}

/**
 * Build a signed VNPAY payment redirect URL.
 *
 * @param {object} config - VNPAY configuration (tmnCode, hashSecret, paymentUrl, returnUrl)
 * @param {object} payload - Payment details (amount, txnRef, bookingCode, ipAddress, createdAt, expiresAt)
 * @returns {string} Complete payment redirect URL with signature
 */
export function buildPaymentUrl(config, payload) {
  const vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: config.tmnCode,
    vnp_Amount: String(Math.round(Number(payload.amount) * 100)),
    vnp_CurrCode: "VND",
    vnp_TxnRef: payload.txnRef,
    vnp_OrderInfo: `Thanh toan phi kham ${payload.bookingCode}`,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: payload.ipAddress,
    vnp_CreateDate: toVnpayDate(payload.createdAt),
    vnp_ExpireDate: toVnpayDate(payload.expiresAt),
  };

  const sortedKeys = Object.keys(vnpParams)
    .filter((key) => key !== "vnp_SecureHash" && key !== "vnp_SecureHashType")
    .filter(
      (key) =>
        vnpParams[key] !== undefined &&
        vnpParams[key] !== null &&
        vnpParams[key] !== ""
    )
    .sort((a, b) => a.localeCompare(b));

  const searchParams = new URLSearchParams();
  for (const key of sortedKeys) {
    searchParams.append(key, vnpParams[key]);
  }

  const signData = searchParams.toString();
  const hmac = crypto.createHmac("sha512", config.hashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  searchParams.append("vnp_SecureHash", signed);

  return `${config.paymentUrl}?${searchParams.toString()}`;
}

/**
 * Verify HMAC-SHA512 signature of incoming VNPAY query params.
 *
 * @param {object|URLSearchParams} query - Query parameters from returnUrl or IPN
 * @param {string} hashSecret - VNPAY hash secret key
 * @returns {boolean} True if signature is valid
 */
export function verifyVnpaySignature(query, hashSecret) {
  if (!query || !hashSecret) {
    return false;
  }

  const queryObj =
    query instanceof URLSearchParams
      ? Object.fromEntries(query.entries())
      : { ...query };

  const secureHash = queryObj.vnp_SecureHash || queryObj.vnp_secure_hash;
  if (!secureHash || typeof secureHash !== "string") {
    return false;
  }

  const sortedKeys = Object.keys(queryObj)
    .filter(
      (key) =>
        key !== "vnp_SecureHash" &&
        key !== "vnp_SecureHashType" &&
        key !== "vnp_secure_hash" &&
        key !== "vnp_secure_hash_type"
    )
    .filter(
      (key) =>
        queryObj[key] !== undefined &&
        queryObj[key] !== null &&
        queryObj[key] !== ""
    )
    .sort((a, b) => a.localeCompare(b));

  const searchParams = new URLSearchParams();
  for (const key of sortedKeys) {
    searchParams.append(key, queryObj[key]);
  }

  const signData = searchParams.toString();
  const hmac = crypto.createHmac("sha512", hashSecret);
  const expectedHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  const hashBuffer = Buffer.from(secureHash.toLowerCase(), "utf-8");
  const expectedBuffer = Buffer.from(expectedHash.toLowerCase(), "utf-8");

  if (hashBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, expectedBuffer);
}
