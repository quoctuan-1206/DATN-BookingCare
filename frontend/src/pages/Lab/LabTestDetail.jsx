import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CircleDollarSign,
  Clock3,
  FlaskConical,
  Hospital,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import labService from "../../services/lab.service";
import { getApiErrorMessage } from "../../api/axios";
import { resolveMediaUrl } from "../../utils/media";

function LabTestDetail() {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await labService.getPublicTest(id);
        if (!cancelled) setTest(data);
      } catch (error) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error, "Không tải được thông tin gói xét nghiệm"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  return (
    <>
      <Header />
      <main className="lab-detail-page">
        <div className="lab-detail-container">
          <Link className="lab-detail-back" to="/lab-tests">
            <ArrowLeft size={18} /> Danh mục xét nghiệm
          </Link>

          {loading ? (
            <div className="lab-state"><span className="lab-spinner" />Đang tải thông tin...</div>
          ) : !test ? (
            <div className="lab-state lab-state--empty">
              <FlaskConical size={38} />
              <h1>Không tìm thấy gói xét nghiệm</h1>
              <Link to="/lab-tests">Quay lại danh mục</Link>
            </div>
          ) : (
            <div className="lab-detail-layout">
              <article className="lab-detail-main">
                {test.image ? (
                  <div className="lab-detail-image">
                    <img src={resolveMediaUrl(test.image)} alt={test.name} />
                  </div>
                ) : null}
                <div className="lab-detail-title">
                  <span><FlaskConical size={22} /></span>
                  <div>
                    <small>Gói xét nghiệm đang cung cấp</small>
                    <h1>{test.name}</h1>
                  </div>
                </div>

                <section className="lab-detail-section">
                  <h2>Thông tin gói xét nghiệm</h2>
                  <p>{test.description || "Thông tin chuyên môn của gói sẽ được nhân viên xét nghiệm tư vấn tại cơ sở."}</p>
                </section>

                <section className="lab-detail-section">
                  <h2>Quy trình đặt lịch</h2>
                  <div className="lab-detail-steps">
                    <div><Hospital size={20} /><strong>Chọn cơ sở</strong><span>Chọn địa điểm xét nghiệm thuận tiện.</span></div>
                    <div><Clock3 size={20} /><strong>Chọn thời gian</strong><span>Chọn ngày và khung giờ còn chỗ.</span></div>
                    <div><CalendarCheck2 size={20} /><strong>Xác nhận lịch</strong><span>Nhận mã lịch và theo dõi kết quả trên tài khoản.</span></div>
                  </div>
                </section>

                <div className="lab-detail-notice">
                  <Info size={20} />
                  <p>Yêu cầu chuẩn bị có thể khác nhau theo từng xét nghiệm. Vui lòng làm theo hướng dẫn của cơ sở trước ngày thực hiện.</p>
                </div>
              </article>

              <aside className="lab-detail-booking-card">
                <span className="lab-detail-booking-card__status"><ShieldCheck size={16} /> Đang nhận lịch</span>
                <div className="lab-detail-price">
                  <CircleDollarSign size={22} />
                  <div><span>Giá tham khảo</span><strong>{Number(test.price || 0).toLocaleString("vi-VN")} đ</strong></div>
                </div>
                <p>Chọn cơ sở và thời gian xét nghiệm ở bước tiếp theo.</p>
                <Link to={`/lab-booking?test_ids=${test.id}`}>
                  Đặt lịch gói này <ArrowRight size={18} />
                </Link>
                <small>Thanh toán trực tiếp tại cơ sở xét nghiệm.</small>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default LabTestDetail;
