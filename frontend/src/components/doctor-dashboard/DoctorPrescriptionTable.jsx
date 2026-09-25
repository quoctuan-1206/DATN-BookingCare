function DoctorPrescriptionTable({ prescription, emptyText = "Chưa kê thuốc." }) {
  const items = prescription?.items || [];

  if (!prescription || items.length === 0) {
    return <p className="doctor-muted">{emptyText}</p>;
  }

  return (
    <div className="doctor-prescription-detail">
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Thuốc</th>
              <th>Số lượng</th>
              <th>Liều dùng</th>
              <th>Hướng dẫn</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id || `${item.medicine_id}-${item.dosage}`}>
                <td>{item.medicine_name}</td>
                <td>
                  {item.quantity}
                  {item.unit ? ` ${item.unit}` : ""}
                </td>
                <td>{item.dosage || "—"}</td>
                <td>{item.instruction || "—"}</td>
                <td>
                  {Number(item.line_total || 0).toLocaleString("vi-VN")} đ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {prescription.note ? (
        <p className="doctor-prescription-note">
          <strong>Ghi chú đơn:</strong> {prescription.note}
        </p>
      ) : null}

      <p className="doctor-prescription-total">
        Tổng tiền thuốc:{" "}
        <strong>
          {Number(prescription.total_amount || 0).toLocaleString("vi-VN")} đ
        </strong>
      </p>
    </div>
  );
}

export default DoctorPrescriptionTable;
