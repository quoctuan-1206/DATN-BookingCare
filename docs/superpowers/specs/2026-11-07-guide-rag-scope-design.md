# Guide RAG Scope Design

## Intent

Trả lời các câu hỏi hướng dẫn sử dụng Booking Care từ nguồn `SYSTEM_GUIDE` đã xuất bản, ví dụ câu hỏi “cách đặt lịch”, thay vì để chatbox trả về lỗi chung.

## Goals

- Giữ metadata của từng patient guide khi chuyển section/FAQ thành knowledge chunk.
- Bảo đảm truy vấn `SYSTEM_GUIDE` trả về dữ liệu của guide phù hợp, gồm URL nguồn chính xác.
- Bảo toàn API `/api/ai/chat`, dữ liệu `PATIENT_GUIDES`, hệ thống chấm điểm và các luồng tra cứu danh mục.

## Non-goals

- Không thay đổi nhận diện intent, prompt Gemini, giao diện chatbox hoặc nội dung hướng dẫn.
- Không sửa các thay đổi không liên quan trong workspace gốc.

## Approaches

1. **Gắn metadata trong callback `flatMap`** — mỗi section/FAQ được map trực tiếp thành record RAG trong phạm vi biến `guide`. Đây là lựa chọn được chọn vì loại bỏ lỗi scope với thay đổi nhỏ nhất.
2. Truyền guide id vào chunk rồi lookup lại sau khi flatten — hoạt động được nhưng thêm xử lý không cần thiết.

## Chosen approach

Sửa `retrieveKnowledge` để `PATIENT_GUIDES.flatMap` trả về các record hoàn chỉnh, dùng chính `guide.id`, `guide.title`, `guide.category`, `guide.sourceUrl` và `guide.updatedAt` trong callback tương ứng. Test hồi quy kiểm tra câu “cách đặt lịch khám” trả `patient-booking-guide`.
