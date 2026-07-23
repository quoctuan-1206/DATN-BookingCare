function BookingForm({ formData, onChange }) {
    const handleChange = (e) => {
        const { name, value } = e.target;

        onChange((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <div className="booking-card">
            <div className="booking-card-head">
                <span className="booking-step">Bước 2</span>
                <h2>Thông tin khám bệnh</h2>
                <p>Mô tả ngắn triệu chứng để bác sĩ chuẩn bị trước buổi khám.</p>
            </div>

            <div className="booking-form">
                <div className="form-group">
                    <label>
                        Lý do khám <span>*</span>
                    </label>

                    <textarea
                        name="reason"
                        rows="4"
                        placeholder="Ví dụ: Ho kéo dài, đau đầu, sốt cao..."
                        value={formData.reason}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Ghi chú thêm</label>

                    <textarea
                        name="note"
                        rows="3"
                        placeholder="Thông tin bổ sung cho bác sĩ (nếu có)..."
                        value={formData.note}
                        onChange={handleChange}
                    />
                </div>
            </div>
        </div>
    );
}

export default BookingForm;
