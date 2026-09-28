# VNPAY Sandbox cho phí khám

## Mục tiêu và phạm vi

Tích hợp VNPAY Sandbox để người bệnh thanh toán **phí khám** (`CLINIC_FEE`) ngay sau khi đặt lịch. Hệ thống chỉ ghi nhận thanh toán khi nhận được callback VNPAY có chữ ký hợp lệ và trạng thái thành công.

Không thay đổi thanh toán tiền thuốc (`MEDICINE_FEE`); khoản này tiếp tục được xử lý sau khám. Tính năng phải hỗ trợ người dùng quét VNPAY-QR trên trang thanh toán Sandbox.

Sau khi đặt lịch, hóa đơn và lịch hẹn được giữ ở trạng thái chưa thanh toán trong 10 phút. Người bệnh có thể thanh toán lại trong thời gian đó. Khi hết hạn mà chưa thanh toán, hệ thống tự hủy lịch hẹn và nhả chỗ khám.

## Ràng buộc và quyết định

- Môi trường đầu tiên là VNPAY Sandbox.
- Backend là nguồn tin cậy duy nhất cho số tiền, trạng thái thanh toán và bí mật ký.
- `vnp_HashSecret` không bao giờ được đưa vào frontend hoặc commit vào Git.
- Return URL chỉ phục vụ trải nghiệm người dùng. IPN là nguồn xác nhận server-to-server đáng tin cậy.
- VNPAY yêu cầu `vnp_TxnRef` không trùng trong ngày; hệ thống tạo mã duy nhất và lưu cùng hóa đơn.
- VNPAY nhận `vnp_Amount` bằng số tiền VND nhân 100.

## Mô hình dữ liệu

Mở rộng model `invoices`:

- `payment_expires_at DateTime?`: hạn thanh toán, chỉ đặt cho hóa đơn phí khám thanh toán VNPAY.
- `vnp_txn_ref String? @unique`: mã tham chiếu merchant gửi VNPAY.

Các trường hiện có được dùng như sau:

- `payment_method = VNPAY` khi khởi tạo một giao dịch VNPAY hoặc nhận thanh toán thành công.
- `payment_status = UNPAID` khi tạo hóa đơn; `PAID` khi IPN thành công.
- `transaction_id` lưu `vnp_TransactionNo` sau thành công.
- `payment_date` lưu thời điểm VNPAY báo thanh toán.

Không thêm trạng thái `EXPIRED`: sau khi quá hạn hóa đơn vẫn `UNPAID`, có `payment_expires_at` trong quá khứ; appointment liên quan được chuyển `CANCELLED`. Điều này giữ tương thích với enum hiện có.

## Kiến trúc backend

Thêm mô-đun payment theo phân tầng hiện tại:

`payment.routes.js` -> `payment.controller.js` -> `payment.service.js` -> `payment.repository.js` -> Prisma.

`payment.service.js` chịu trách nhiệm:

- Kiểm tra quyền sở hữu appointment/invoice của Patient.
- Tạo URL VNPAY Sandbox với tham số được chuẩn hóa, sắp xếp và ký HMAC-SHA512.
- Xác minh return query và IPN query trước mọi truy cập dữ liệu.
- Đối chiếu `vnp_TxnRef`, số tiền, mã giao dịch và hạn thanh toán.
- Xử lý IPN idempotent trong transaction.
- Hủy các hóa đơn quá hạn và nhả slot bằng transaction.

Các endpoint:

- `POST /api/payments/vnpay/:invoiceId/create` (Auth/Patient): tạo hoặc lấy lại payment URL của một hóa đơn `CLINIC_FEE` do người dùng sở hữu, chỉ khi appointment chưa hủy và chưa quá hạn.
- `GET /api/payments/vnpay/return`: kiểm tra chữ ký callback từ VNPAY, sau đó redirect về trang frontend kết quả. Endpoint này không dựa vào dữ liệu query chưa xác thực để hiển thị hoặc ghi trạng thái.
- `GET /api/payments/vnpay/ipn`: endpoint server-to-server của VNPAY, kiểm tra checksum trước, áp dụng kết quả thanh toán atomically và trả response code theo giao thức VNPAY.
- `GET /api/payments/:invoiceId/status` (Auth/Patient): trả trạng thái hóa đơn, hạn thanh toán và thông tin tối thiểu để frontend hiển thị/retry.

Các giá trị Sandbox được đặt trong `.env` và mô tả trong `.env.example`:

`VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_PAYMENT_URL`, `VNPAY_RETURN_URL`, `VNPAY_IPN_URL`, `FRONTEND_URL`.

## Luồng nghiệp vụ

1. `POST /api/appointments` tạo appointment `PENDING`, invoice `CLINIC_FEE/UNPAID`, hạn `now + 10 minutes` và `vnp_txn_ref` trong cùng transaction. Response trả `invoiceId` và payment URL hoặc frontend gọi create endpoint ngay sau đó.
2. Frontend chuyển hướng người dùng tới VNPAY Sandbox. Người dùng chọn VNPAY-QR và quét QR để thanh toán.
3. VNPAY đưa trình duyệt tới Return URL. Backend xác minh chữ ký và redirect frontend đến trang kết quả thanh toán.
4. IPN hợp lệ với cả `vnp_ResponseCode` và `vnp_TransactionStatus` là `00` đặt invoice thành `PAID`, lưu VNPAY transaction number và thời điểm thanh toán. Nếu IPN bị gửi lại, hệ thống trả kết quả thành công mà không ghi lại thay đổi.
5. Frontend trang kết quả gọi status API trong một khoảng ngắn để phản ánh kết quả IPN. Nếu giao dịch bị hủy/lỗi, nút thanh toán lại còn khả dụng đến hạn.
6. Background job chạy mỗi phút và cả khi khởi động backend. Với invoice `UNPAID` đã quá hạn, transaction kiểm tra chưa thanh toán, đặt appointment `CANCELLED` và giảm `schedules.booked_patients` một lần duy nhất.

## Frontend

- Sau khi đặt lịch thành công, chuyển trực tiếp tới VNPAY URL thay vì chỉ hiển thị mã đặt lịch.
- Thêm trang kết quả VNPAY hiển thị: đang xác nhận, thành công, thất bại/đang chờ; liên kết về chi tiết lịch hẹn.
- Trong chi tiết lịch hẹn, hóa đơn `UNPAID` còn hạn có hiển thị đồng hồ đếm ngược và nút “Thanh toán lại”. Hóa đơn hết hạn chỉ hiển thị lịch đã hủy; không có retry.
- Không tạo hoặc tính số tiền thanh toán ở frontend.

## Xử lý lỗi và an toàn

- HMAC-SHA512 được tạo/xác minh từ query parameters đã loại `vnp_SecureHash` và sắp xếp đúng quy tắc VNPAY.
- Từ chối callback/IPN sai chữ ký, sai `vnp_TxnRef`, sai số tiền, mã giao dịch không hợp lệ hoặc giao dịch quá hạn.
- Payment URL retry không tạo appointment/invoice mới và luôn lấy amount từ database.
- IPN, job timeout và cancellation sử dụng điều kiện trạng thái trong transaction để tránh double-release slot hoặc ghi nhận sau hạn.
- Chỉ IPN hợp lệ mới được phép cập nhật `PAID`; Return URL không thay thế IPN.
- IPN phải truy cập được qua HTTPS công khai khi test local (có thể dùng tunnel); Return URL/IPN phải được khai báo trong cấu hình Sandbox.

## Kiểm thử

- Unit test hàm chuẩn hóa query, tạo HMAC-SHA512 và xác minh callback.
- Unit test tạo payment URL, gồm amount x100, hạn 10 phút và txn ref duy nhất.
- Integration test IPN thành công, IPN lặp lại, chữ ký sai, amount sai, thất bại và IPN đến sau hạn.
- Integration test retry trước hạn không tạo bản ghi mới.
- Integration test background job hủy appointment quá hạn, nhả slot một lần và không hủy invoice đã `PAID`.
- Smoke test Sandbox thủ công: tạo lịch, chọn VNPAY-QR, thanh toán bằng thông tin Sandbox, quan sát invoice `PAID` và trang kết quả.

## Tiêu chí hoàn thành

- Người bệnh hoàn tất thanh toán QR Sandbox cho phí khám, invoice thành `PAID` chỉ qua callback đã xác minh.
- Lịch chưa thanh toán có thể retry trong 10 phút.
- Lịch chưa thanh toán bị tự hủy và slot được nhả sau 10 phút.
- Tiền thuốc không bị thay đổi bởi tính năng này.
