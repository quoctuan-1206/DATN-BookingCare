import { useEffect, useState } from "react";
import { Activity, ImageOff } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import { getApiErrorMessage } from "../../api/axios";
import clinicalService from "../../services/clinical.service";
import { resolveMediaUrl } from "../../utils/media";

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function ClinicalServiceCatalog() {
  const [searchParams] = useSearchParams();
  const serviceType = searchParams.get("service_type") || "";
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      setLoading(true);
      setError("");
      try {
        const data = await clinicalService.getPublicServices({
          booking_mode: "SELF_BOOKING",
          ...(serviceType ? { service_type: serviceType } : {}),
        });
        if (!cancelled) setServices(data);
      } catch (loadError) {
        if (!cancelled) {
          const message = getApiErrorMessage(
            loadError,
            "Không tải được danh sách dịch vụ cận lâm sàng",
          );
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadServices();
    return () => {
      cancelled = true;
    };
  }, [serviceType]);

  return (
    <>
      <Header />
      <main className="clinical-public-page">
        <section className="clinical-public-hero">
          <span><Activity size={18} /> Dịch vụ dành cho bạn</span>
          <h1>Dịch vụ cận lâm sàng</h1>
          <p>Chọn dịch vụ phù hợp và chủ động đặt lịch thực hiện.</p>
        </section>

        <section className="clinical-public-content" aria-live="polite">
          {loading ? (
            <div className="clinical-public-state">
              <span className="clinical-loading-spinner" />
              <p>Đang tải dịch vụ...</p>
            </div>
          ) : error ? (
            <div className="clinical-public-state clinical-public-state--error">
              <Activity size={34} />
              <h2>Không tải được dịch vụ</h2>
              <p>{error}</p>
            </div>
          ) : services.length === 0 ? (
            <div className="clinical-public-state">
              <Activity size={34} />
              <h2>Chưa có dịch vụ tự đặt</h2>
              <p>Các dịch vụ mới sẽ được cập nhật tại đây.</p>
            </div>
          ) : (
            <div className="clinical-public-grid">
              {services.map((service) => (
                <Link
                  className="clinical-public-card"
                  key={service.id}
                  to={`/clinical-services/${service.id}`}
                  aria-label={`Xem dịch vụ ${service.name}`}
                >
                  <div className="clinical-public-card__image">
                    {service.image ? (
                      <img src={resolveMediaUrl(service.image)} alt={service.name} />
                    ) : (
                      <span><ImageOff size={34} /></span>
                    )}
                  </div>
                  <div className="clinical-public-card__body">
                    <h2>{service.name}</h2>
                    <div className="clinical-public-card__price">
                      <span>Giá dịch vụ</span>
                      <strong>{formatPrice(service.price)}</strong>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default ClinicalServiceCatalog;
