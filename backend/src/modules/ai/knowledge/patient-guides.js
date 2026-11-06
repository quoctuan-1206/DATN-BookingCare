const guide = (id, title, description, category, sections, faqs = []) => ({
  id,
  title,
  description,
  category,
  sourceUrl: `/help/${id}`,
  updatedAt: "2026-11-02",
  sections,
  faqs,
});

export const PATIENT_GUIDES = [
  guide("patient-account-guide", "Tài khoản và hồ sơ bệnh nhân", "Tạo tài khoản, đăng nhập và quản lý hồ sơ người đi khám.", "Tài khoản", [
    { id: "register", title: "Đăng ký và đăng nhập", content: "Mở Đăng nhập để vào tài khoản. Nếu chưa có tài khoản, chọn Đăng ký và làm theo biểu mẫu. Các trang đặt lịch, hồ sơ, lịch hẹn và hồ sơ khám yêu cầu đăng nhập bằng tài khoản bệnh nhân." },
    { id: "profiles", title: "Quản lý hồ sơ người bệnh", content: "Mở khu vực bệnh nhân rồi chọn Hồ sơ bệnh nhân để xem hoặc quản lý hồ sơ. Khi đặt lịch, chọn hồ sơ đúng với người sẽ đi khám. Chỉ thêm và chỉnh sửa thông tin theo các trường được hiển thị trên website." },
    { id: "password", title: "Quên hoặc đổi mật khẩu", content: "Tại màn hình đăng nhập, dùng chức năng Quên mật khẩu và làm theo hướng dẫn xác minh. Khi đã đăng nhập, mở Tài khoản để vào trang hồ sơ và chức năng mật khẩu nếu được hiển thị." },
  ], [
    { question: "Có cần đăng nhập để đặt lịch không?", answer: "Có. Đặt lịch yêu cầu tài khoản bệnh nhân và hồ sơ người đi khám." },
    { question: "Tôi có thể đặt lịch cho người thân không?", answer: "Biểu mẫu đặt lịch cho phép chọn một hồ sơ bệnh nhân. Hãy chọn hồ sơ của người sẽ đi khám." },
  ]),
  guide("patient-doctor-search-guide", "Tìm bác sĩ và chuyên khoa", "Duyệt bác sĩ, lịch làm việc và danh sách chuyên khoa.", "Tìm dịch vụ", [
    { id: "doctors", title: "Tìm bác sĩ", content: "Mở mục Bác sĩ để xem danh sách. Chọn một bác sĩ để xem hồ sơ, nơi làm việc và lịch khám khả dụng. Bạn cũng có thể mở Chuyên khoa hoặc Cơ sở y tế để tìm theo danh mục." },
    { id: "schedule", title: "Chọn lịch khám", content: "Trong hồ sơ bác sĩ, xem các ngày và khung giờ còn hiển thị. Chọn một khung giờ để mở trang đặt lịch. Lịch có thể thay đổi theo dữ liệu hiện trên hệ thống." },
  ], [
    { question: "Tôi không thấy khung giờ muốn đặt, phải làm sao?", answer: "Chỉ những khung giờ đang hiển thị và có thể chọn mới mở được bước đặt lịch. Hãy kiểm tra ngày khác hoặc bác sĩ khác." },
  ]),
  guide("patient-booking-guide", "Đặt lịch khám", "Chọn bác sĩ và giờ khám, nhập thông tin rồi gửi yêu cầu đặt lịch.", "Đặt lịch", [
    { id: "requirements", title: "Điều kiện cần thiết", content: "Bạn cần đăng nhập bằng tài khoản bệnh nhân, có hồ sơ người đi khám, và mở trang này từ một khung giờ còn khả dụng trong hồ sơ bác sĩ. Ngày khám phải là hôm nay hoặc một ngày trong tương lai." },
    { id: "steps", title: "Các bước đặt lịch", content: "1. Tại mục Bác sĩ, mở hồ sơ bác sĩ và chọn ngày, khung giờ phù hợp.\n2. Chọn Đặt lịch.\n3. Chọn hồ sơ bệnh nhân sẽ đi khám.\n4. Nhập Lý do khám; Ghi chú thêm là tùy chọn.\n5. Kiểm tra bác sĩ, cơ sở, hình thức khám và thời gian.\n6. Chọn ô xác nhận thông tin rồi nhấn Xác nhận đặt lịch.\n7. Theo dõi kết quả trên trang thành công hoặc trong Lịch hẹn của tôi." },
    { id: "result", title: "Kết quả mong đợi", content: "Website gửi yêu cầu và hiển thị trang xác nhận hoặc chuyển sang trang thanh toán nếu có hóa đơn và liên kết thanh toán được tạo. Trạng thái lịch hẹn xem tại khu vực bệnh nhân, mục Lịch hẹn của tôi." },
    { id: "troubleshooting", title: "Lỗi thường gặp", content: "Nếu thiếu bác sĩ hoặc khung giờ, quay lại hồ sơ bác sĩ và chọn giờ trước. Nếu chưa chọn hồ sơ, hãy tạo hoặc chọn hồ sơ bệnh nhân. Lý do khám và ô xác nhận thông tin là bắt buộc. Nếu ngày khám không đáp ứng thời gian báo trước, chọn một ngày khác đang khả dụng." },
  ], [
    { question: "Tại sao nút xác nhận đặt lịch chưa dùng được?", answer: "Cần có hồ sơ bệnh nhân được chọn, nhập lý do khám, đồng ý xác nhận thông tin và không có yêu cầu nào đang gửi." },
    { question: "Tôi xem lịch vừa đặt ở đâu?", answer: "Mở khu vực bệnh nhân và chọn Lịch hẹn của tôi." },
  ]),
  guide("patient-appointment-guide", "Xem và xử lý lịch hẹn", "Theo dõi trạng thái, mở chi tiết và dùng các thao tác được hiển thị cho lịch hẹn.", "Lịch hẹn", [
    { id: "view", title: "Xem lịch hẹn", content: "Đăng nhập, mở khu vực bệnh nhân và chọn Lịch hẹn của tôi. Có thể xem danh sách theo các tab trạng thái và mở một lịch để xem chi tiết." },
    { id: "actions", title: "Thao tác với lịch hẹn", content: "Trong chi tiết lịch hẹn, chỉ các nút thao tác đang hiển thị và khả dụng mới dùng được. Nếu có nút hủy, gửi yêu cầu theo hướng dẫn xác nhận trên màn hình; nếu có nút chỉnh sửa, làm theo biểu mẫu được mở. Điều kiện thao tác phụ thuộc trạng thái lịch." },
    { id: "payments", title: "Thanh toán", content: "Nếu lịch hẹn có hóa đơn chưa thanh toán, mở chi tiết lịch hẹn để xem trạng thái và phương thức được cung cấp. Khi hệ thống tạo liên kết VNPAY, website sẽ chuyển tới cổng thanh toán; kết quả được trả về trang kết quả thanh toán. Không gửi lại giao dịch khi chưa kiểm tra trạng thái hiện tại." },
  ], [
    { question: "Tôi có thể hủy hoặc đổi mọi lịch hẹn không?", answer: "Các thao tác phụ thuộc trạng thái và nút được bật trên chi tiết lịch hẹn. Hãy kiểm tra trực tiếp lịch cụ thể; website không đảm bảo mọi lịch đều cho phép thay đổi." },
    { question: "Thanh toán xong nhưng trạng thái chưa đổi?", answer: "Mở lại chi tiết lịch hẹn hoặc trang kết quả thanh toán để kiểm tra trạng thái được hệ thống ghi nhận." },
  ]),
  guide("patient-online-consultation-guide", "Tham gia tư vấn trực tuyến", "Mở phòng tư vấn từ lịch trực tuyến và kiểm tra camera, micro, mạng.", "Tư vấn trực tuyến", [
    { id: "prepare", title: "Trước buổi tư vấn", content: "Mở lịch hẹn trực tuyến đã được xác nhận và dùng nút vào phòng nếu nút này khả dụng. Cho phép trình duyệt truy cập camera và microphone khi được hỏi. Dùng kết nối mạng ổn định." },
    { id: "room", title: "Trong phòng tư vấn", content: "Trong phòng, dùng các nút Micro và Camera để bật hoặc tắt thiết bị; mở Thiết bị để chọn camera, microphone hoặc loa. Bảng Thông tin hiển thị lịch hẹn và người tham gia. Bệnh nhân có thể chọn Rời phòng để thoát." },
    { id: "troubleshooting", title: "Xử lý sự cố kết nối", content: "Kiểm tra kết nối mạng và quyền camera, microphone trong cài đặt trình duyệt. Mở Thiết bị để chọn đúng thiết bị. Khi có lỗi, chọn Thử kết nối lại hoặc tải lại phòng tư vấn. Nếu trình duyệt chặn quyền, cấp quyền trong cài đặt trang rồi thử lại." },
  ], [
    { question: "Vì sao tôi không vào được phòng?", answer: "Kiểm tra lịch hẹn trực tuyến và trạng thái của lịch, sau đó kiểm tra mạng và quyền camera, microphone của trình duyệt." },
    { question: "Tôi có thể chọn camera hoặc micro khác không?", answer: "Có. Mở Thiết bị hoặc Thông tin trong phòng để quản lý thiết bị đang dùng." },
  ]),
  guide("patient-medical-record-guide", "Hồ sơ khám, xét nghiệm và đơn thuốc", "Xem hồ sơ sức khỏe và các kết quả đã được chia sẻ với tài khoản của bạn.", "Hồ sơ sức khỏe", [
    { id: "records", title: "Xem hồ sơ khám", content: "Đăng nhập và mở khu vực bệnh nhân, chọn Hồ sơ khám để xem danh sách. Chọn một hồ sơ để mở chi tiết. Chỉ dữ liệu được liên kết với tài khoản và được hệ thống cấp quyền mới hiển thị." },
    { id: "prescriptions", title: "Xem đơn thuốc", content: "Mở hồ sơ khám tương ứng và xem phần đơn thuốc nếu có. Nội dung trên website là thông tin do cơ sở khám ghi nhận; hãy liên hệ nhân viên y tế nếu có thắc mắc về chỉ định." },
    { id: "labs", title: "Xem xét nghiệm và dịch vụ cận lâm sàng", content: "Trong khu vực bệnh nhân, mở mục Xét nghiệm hoặc Cận lâm sàng để xem các yêu cầu liên quan. Mở một mục để xem trạng thái và kết quả đã được cập nhật nếu có." },
  ], [
    { question: "Vì sao tôi chưa thấy kết quả?", answer: "Kết quả chỉ hiển thị sau khi được cơ sở khám cập nhật và liên kết với hồ sơ của bạn. Kiểm tra lại sau hoặc liên hệ cơ sở khám." },
  ]),
  guide("patient-reviews-guide", "Đánh giá bác sĩ", "Đánh giá hoặc cập nhật đánh giá sau khi lịch hẹn hoàn tất.", "Đánh giá", [
    { id: "review", title: "Gửi hoặc cập nhật đánh giá", content: "Đăng nhập, mở Lịch hẹn của tôi rồi chọn một lịch đã hoàn tất để vào chi tiết. Trong phần đánh giá, chọn số sao; nhận xét là tùy chọn. Chọn Gửi đánh giá để gửi lần đầu hoặc Sửa đánh giá rồi chọn Cập nhật để lưu thay đổi." },
  ], [
    { question: "Tại sao tôi chưa gửi được đánh giá?", answer: "Quyền gửi đánh giá phụ thuộc điều kiện của lịch hẹn và các trường bắt buộc trong biểu mẫu. Kiểm tra thông báo trên màn hình." },
  ]),
  guide("patient-ai-chatbot-guide", "Sử dụng MediUTE AI và tìm trợ giúp", "Hỏi chatbot về bác sĩ, cơ sở, chuyên khoa và cách sử dụng website.", "Trợ giúp", [
    { id: "chatbot", title: "Hỏi MediUTE AI", content: "Trên website Booking Care (MediUTE), mở biểu tượng MediUTE AI ở góc màn hình và nhập câu hỏi. Chatbot có thể tra cứu bác sĩ, cơ sở, chuyên khoa và các bài viết đã xuất bản cùng hướng dẫn sử dụng. Chọn liên kết nguồn bên dưới câu trả lời để mở trang liên quan." },
    { id: "limits", title: "Khi chưa có thông tin", content: "Chatbot sẽ báo khi không tìm thấy tài liệu phù hợp. Không dùng chatbot để đặt lịch, thanh toán, truy cập hồ sơ cá nhân, chẩn đoán hoặc thay thế tư vấn chuyên môn." },
    { id: "help", title: "Tìm hướng dẫn", content: "Trên trang Hướng dẫn sử dụng, nhập từ khóa để tìm trong tiêu đề, mô tả và nội dung; chọn danh mục để thu hẹp kết quả. Mỗi bài có địa chỉ riêng để mở trực tiếp hoặc chia sẻ." },
  ], [
    { question: "Chatbot có thể xem hồ sơ hoặc đặt lịch cho tôi không?", answer: "Không. Chatbot cung cấp thông tin tham khảo và không thực hiện thao tác hồ sơ, đặt lịch hay thanh toán." },
  ]),
];

export function findPatientGuide(id) {
  return PATIENT_GUIDES.find((item) => item.id === id) || null;
}
