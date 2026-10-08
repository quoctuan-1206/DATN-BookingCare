# Audit Log production design

## A. Kiến trúc hiện tại

- Backend: Node.js 20, JavaScript ESM, Express 5, Prisma 6 và MySQL 8.
- Luồng backend hiện tại: `route -> controller -> service -> repository -> Prisma`.
- Xác thực: Bearer access token; `verifyAccessTokenMiddleware` nạp lại user và role từ database. Phân quyền dùng `authorize(...roles)`.
- Database được bootstrap theo hai đường: `db.txt` cho MySQL container mới và các script `ensure-*` cho database đang tồn tại. Dự án chưa dùng Prisma migrations làm nguồn deploy chính.
- Frontend: React 19, Vite, React Router và Axios interceptor. Frontend chỉ đọc Audit Log qua API; session auth hiện dùng localStorage nhưng dữ liệu Audit Log không dùng localStorage.

## B. Database/schema

Model `audit_logs` có:

- `id BIGINT UNSIGNED`: đủ không gian cho bảng tăng nhanh; API serialize thành string.
- `user_id INT NULL`: actor có thể không biết (LOGIN_FAILED) hoặc là hệ thống/callback VNPAY. FK `ON DELETE SET NULL` để không làm mất lịch sử.
- `action`, `resource`: varchar được validate bằng allowlist trong backend, dễ mở rộng hơn MySQL ENUM.
- `resource_id VARCHAR(191) NULL`: hỗ trợ cả integer, UUID hoặc business key.
- `old_value`, `new_value`, `metadata`: JSON nullable.
- `ip_address VARCHAR(45)`: đủ IPv4/IPv6.
- `user_agent VARCHAR(512)` và `created_at DATETIME(3)`.

Index phục vụ truy vấn chính:

- `(created_at, id)` cho sort ổn định.
- `(user_id, created_at)`.
- `(action, created_at)`.
- `(resource, created_at)`.
- `(resource_id, created_at)`.
- `(resource, resource_id, created_at)`.

Schema được khai báo trong Prisma, `db.txt`, và script idempotent `ensure-audit-log-schema.js` cho database hiện hữu.

## C. API

`GET /api/admin/audit-logs`

- Query: `page`, `limit` (tối đa 100), `search`, `userId`, `action`, `resource`, `resourceId`, `dateFrom`, `dateTo`, `sortOrder=asc|desc`.
- Sort field cố định là `createdAt`, có tie-break bằng `id`.
- List chỉ trả dữ liệu cần cho bảng, không đọc các JSON lớn.

`GET /api/admin/audit-logs/:id`

- Trả đầy đủ `oldValue`, `newValue`, `metadata`, IP, User Agent, thời gian và actor.

Cả hai endpoint yêu cầu JWT, role `Admin`, và header `Cache-Control: private, no-store`. Không có POST/PATCH/PUT/DELETE Audit Log.

## D. Backend service

`AuditLogService` có hai chế độ:

- `create()`: strict, dùng cho test hoặc tác vụ muốn nhận lỗi persistence.
- `record()`: bắt mọi lỗi ghi log và trả `null`; các service nghiệp vụ dùng phương thức này sau khi mutation/transaction đã commit.

`AsyncLocalStorage` giữ request context server-side gồm request ID, IP, User Agent, method và path. Chỉ `req.ip` của Express được dùng. Khi chạy sau reverse proxy, operator phải cấu hình `TRUST_PROXY_HOPS`; backend không tự tin header `X-Forwarded-For`.

Sanitizer đệ quy chạy cả lúc ghi và đọc, mask password, token, OTP, Authorization, Cookie, secret, API key, secure hash, credential và private key. Business service dùng snapshot allowlist thay vì dump toàn bộ request body/entity.

## E. React UI

Route `/admin/audit-logs` có:

- Server-side pagination (20/50/100).
- Search; filter Action, Resource, User ID, Resource ID, khoảng ngày; sort mới/cũ.
- Bảng User, Action, Resource, Resource ID, IP, Time và Detail.
- Detail drawer tải riêng endpoint `/:id`, render JSON bằng text trong `<pre>` (không dùng `dangerouslySetInnerHTML`), hỗ trợ Escape/focus trap.
- Guard Admin ở cả trang và `AdminLayout`; backend vẫn là security boundary thật.

## F. File triển khai

Backend core:

- `backend/prisma/schema.prisma`
- `backend/scripts/ensure-audit-log-schema.js`
- `backend/src/constants/audit-log.constants.js`
- `backend/src/context/request-context.js`
- `backend/src/utils/audit-log.js`
- `backend/src/repositories/audit-log.repository.js`
- `backend/src/services/audit-log.service.js`
- `backend/src/validators/audit-log.validator.js`
- `backend/src/controllers/audit-log.controller.js`
- `backend/src/routes/audit-log.routes.js`
- `backend/src/app.js`

Business integration:

- `auth.service.js`, `user.service.js`, `appointment.service.js`
- `medical-record.service.js`, `prescription.service.js`, `lab.service.js`
- `payment.service.js`

Frontend:

- `frontend/src/pages/Admin/AuditLogs.jsx`
- `frontend/src/components/admin/AuditLogDetailDrawer.jsx`
- `frontend/src/services/audit-log.service.js`
- `frontend/src/utils/audit-log.js`
- `frontend/src/styles/audit-log.css`
- Route/sidebar/layout wiring.

## G. Điểm tích hợp nghiệp vụ

- Login: `LOGIN`, `LOGIN_FAILED`; logout một/mọi thiết bị: `LOGOUT`; reset/change password chỉ log cờ kết quả, không log credential.
- Appointment: `CREATE_APPOINTMENT`, `CONFIRM_APPOINTMENT`, `CANCEL_APPOINTMENT`, `UPDATE`, và `VIEW` detail.
- Medical Record: log `VIEW` list/detail, `CREATE_MEDICAL_RECORD`, `UPDATE_MEDICAL_RECORD` với before/after của các field thay đổi.
- Prescription: log `VIEW`, `CREATE_PRESCRIPTION`, `UPDATE_PRESCRIPTION`.
- Lab: log tạo/view Lab Order, cập nhật/view Lab Result và mọi lần server cấp file kết quả bằng `DOWNLOAD_LAB_RESULT`.
- Payment: log `PAYMENT_SUCCESS` sau commit IPN/mock; log `PAYMENT_FAILED` khi gateway/mock trả thất bại. Secure hash/signature không được ghi.
- `REFUND` đã có trong allowlist/schema/UI, nhưng project hiện chưa có nghiệp vụ hoặc endpoint hoàn tiền để gắn log. Khi bổ sung refund thật, chỉ ghi `REFUND` sau khi provider và database xác nhận thành công; không tạo luồng hoàn tiền giả chỉ để sinh Audit Log.
- User management: tạo STAFF bằng `CREATE`; khóa/mở khóa bằng `LOCK_USER`/`UNLOCK_USER` với before/after.

Các action/resource còn lại đã nằm trong allowlist để các module CRUD khác tích hợp bằng cùng `AuditLogService.record()` mà không cần đổi schema.

## H. Test tự động

- Unit test sanitizer/context/service: masking, BigInt serialization, list nhẹ, và audit failure không phá nghiệp vụ.
- Validator test pagination/filter/date order.
- Authorization test chỉ Admin qua được.
- Router test chỉ expose GET.
- Frontend service/helper test: API contract, pagination normalization, safe JSON display và actor fallback.

## I. Danh sách test cần chạy

1. Admin lấy list/detail thành công; Patient/Doctor/STAFF nhận 403; anonymous nhận 401.
2. Không có endpoint mutation Audit Log; thử POST/PATCH/DELETE phải 404/405.
3. Pagination biên, limit 1/100/101, sort asc/desc ổn định khi trùng timestamp.
4. Từng filter độc lập và tổ hợp; `dateFrom > dateTo`; ID/date sai định dạng.
5. LOGIN đúng/sai/locked; logout; reset/change password.
6. Create/confirm/cancel appointment; concurrent status update.
7. View/create/update bệnh án và đơn thuốc; actor không có quyền không tạo log thành công giả.
8. Create/update/view/download Lab Result; file không tồn tại; send file lỗi sau authorization.
9. Payment IPN hợp lệ, checksum sai, amount sai, callback lặp/idempotent, mock success/failure.
10. Lock/unlock user; admin không tự khóa; user bị xóa vẫn giữ log với `userId` nullable.
11. Payload lồng sâu/array/lớn/circular; mọi biến thể password/token/OTP/cookie/authorization/secure hash đều bị mask.
12. IPv4, IPv6, reverse proxy hop đúng/sai; User Agent dài và CR/LF.
13. Audit database unavailable: nghiệp vụ vẫn commit, lỗi được ghi server; khi yêu cầu compliance cao, kiểm thử outbox/worker retry.
14. UI empty/loading/error/abort race, detail 404, dữ liệu JSON chứa XSS, mobile layout và keyboard navigation.

## J. Security, transaction và performance

- Audit write hiện là best-effort sau commit, tương thích transaction sẵn có và không rollback nghiệp vụ. Trade-off là có crash window giữa business commit và audit insert.
- Nếu Audit Log là bằng chứng compliance không được phép mất: thêm transactional outbox trong chính transaction nghiệp vụ, event ID duy nhất, worker idempotent, retry/backoff và dead-letter queue. Không dùng EventEmitter/in-memory queue để thay cho durable outbox.
- App DB user nên chỉ có `INSERT` và `SELECT` trên `audit_logs`; quyền archive/delete dành cho maintenance identity riêng. Có thể bật MySQL audit/trigger hoặc immutable archive nếu quy định yêu cầu.
- Offset pagination hiện phù hợp màn hình admin và được giới hạn 100. Khi bảng rất lớn/deep page, chuyển sang cursor `(created_at,id)` và tránh exact total count ở mọi request.
- `contains search` có thể scan; khuyến nghị bắt buộc date range cho truy vấn lớn hoặc đưa search sang OpenSearch/Elasticsearch khi volume cao.
- Retention phải theo quy định y tế/pháp lý nội bộ. Mẫu vận hành: giữ hot 12-18 tháng, partition theo tháng, archive mã hóa sang storage immutable/WORM, kiểm tra checksum/restore, rồi purge theo job có phê duyệt. Không hard-delete ad hoc từ API.
- Theo dõi metric `audit_write_failed`, latency, table growth, archive lag và cảnh báo khi disk/index tăng bất thường.
