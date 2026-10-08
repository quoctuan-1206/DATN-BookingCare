export const AUDIT_ACTIONS = Object.freeze([
  "LOGIN",
  "LOGOUT",
  "LOGIN_FAILED",
  "CREATE",
  "UPDATE",
  "DELETE",
  "VIEW",
  "DOWNLOAD",
  "CREATE_APPOINTMENT",
  "CANCEL_APPOINTMENT",
  "CONFIRM_APPOINTMENT",
  "CREATE_MEDICAL_RECORD",
  "UPDATE_MEDICAL_RECORD",
  "CREATE_PRESCRIPTION",
  "UPDATE_PRESCRIPTION",
  "CREATE_LAB_ORDER",
  "UPDATE_LAB_RESULT",
  "DOWNLOAD_LAB_RESULT",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "REFUND",
  "CHANGE_PASSWORD",
  "RESET_PASSWORD",
  "LOCK_USER",
  "UNLOCK_USER",
]);

export const AUDIT_RESOURCES = Object.freeze([
  "USER",
  "PATIENT",
  "DOCTOR",
  "CLINIC",
  "SPECIALTY",
  "APPOINTMENT",
  "MEDICAL_RECORD",
  "PRESCRIPTION",
  "LAB_ORDER",
  "LAB_RESULT",
  "PAYMENT",
  "REVIEW",
  "NOTIFICATION",
]);

export const AUDIT_ACTION = Object.freeze(
  Object.fromEntries(AUDIT_ACTIONS.map((action) => [action, action])),
);

export const AUDIT_RESOURCE = Object.freeze(
  Object.fromEntries(AUDIT_RESOURCES.map((resource) => [resource, resource])),
);

export const AUDIT_ACTION_SET = new Set(AUDIT_ACTIONS);
export const AUDIT_RESOURCE_SET = new Set(AUDIT_RESOURCES);
