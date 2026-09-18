import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CalendarCheck2,
  Clock3,
  ImageOff,
  Info,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import { getApiErrorMessage } from "../../api/axios";
import clinicalService from "../../services/clinical.service";
import {
  CLINICAL_TYPE_LABEL,
  formatClinicalPrice,
} from "../../components/clinical/clinical.constants";
import { resolveMediaUrl } from "../../utils/media";

function ClinicalServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadService() {
      setLoading(true);
      setError("");
      try {
        const data = await clinicalService.getPublicService(id);
        if (!cancelled) setService(data);
      } catch (loadError) {
        if (!cancelled) {
          const message = getApiErrorMessage(
            loadError,
            "Không tải được thông tin dịch vụ",
          );
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadService();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const canSelfBook = service?.booking_mode === "SELF_BOOKING";

  return (
    <>
      <Header />
      <main className="clinical-detail-page">
        <div className="clinical-detail-container">
          <Link className="clinical-detail-back" to="/clinical-services">
            <ArrowLeft size={18} /> Dịch vụ cận lâm sàng
          </Link>

          {loading ? (
            <div className="clinical-public-state">
              <span className="clinical-loading-spinner" />
              <p>Đang tải thông tin dịch vụ...</p>
            </div>
          ) : error || !service ? (
            <div className="clinical-public-state clinical-public-state--error">
              <Activity size={34} />
              <h1>Không tìm thấy dịch vụ</h1>
              <p>{error || "Dịch vụ không còn được cung cấp."}</p>
            </div>
          ) : (
            <div className="clinical-detail-layout">
              <article className="clinical-detail-card">
                <div className="clinical-detail-image">
                  {service.image ? (
                    <img src={resolveMediaUrl(service.image)} alt={service.name} />
                  ) : (
                    <span><ImageOff size={48} /></span>
                  )}
                </div>

                <div className="clinical-detail-copy">
                  <span className="clinical-detail-type">
                    <Activity size={16} />
                    {CLINICAL_TYPE_LABEL[service.service_type] || service.service_type}
                  </span>
                  <h1>{service.name}</h1>
                  <p className="clinical-detail-description">
                    {service.description || "Thông tin chi tiết sẽ được nhân viên tư vấn trước khi thực hiện dịch vụ."}
                  </p>

                  <div className="clinical-detail-meta">
                    <div>
                      <Clock3 size={20} />
                      <span>Thời gian dự kiến</span>
                      <strong>{service.estimated_duration_minutes || "—"} phút</strong>
                    </div>
                    <div>
                      <Wallet size={20} />
                      <span>Giá dịch vụ</span>
                      <strong>{formatClinicalPrice(service.price)}</strong>
                    </div>
                  </div>

                  {service.preparation_instructions ? (
                    <section className="clinical-detail-preparation">
                      <h2><Info size={19} /> Hướng dẫn chuẩn bị</h2>
                      <p>{service.preparation_instructions}</p>
                    </section>
                  ) : null}
                </div>
              </article>

              <aside className="clinical-detail-booking">
                <span><ShieldCheck size={17} /> Dịch vụ đang hoạt động</span>
                <h2>{formatClinicalPrice(service.price)}</h2>
                <p>
                  {canSelfBook
                    ? "Chọn hồ sơ bệnh nhân, cơ sở và khung giờ phù hợp để đặt lịch."
                    : "Dịch vụ này cần có chỉ định của bác sĩ trước khi thực hiện."}
                </p>
                {canSelfBook ? (
                  <Link to={`/clinical-booking?service_id=${service.id}`}>
                    <CalendarCheck2 size={18} /> Đặt lịch ngay
                  </Link>
                ) : (
                  <button type="button" disabled>Cần bác sĩ chỉ định</button>
                )}
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default ClinicalServiceDetail;
