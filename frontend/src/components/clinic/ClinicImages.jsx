import { Settings } from "lucide-react";
import { hasRichText, sanitizeRichText } from "../../utils/richText";

function ClinicImages({ content = "" }) {
  return (
    <section className="clinic-section clinic-images">
      <div className="clinic-section__heading clinic-section__heading--compact">
        <div>
          <span>Cơ sở vật chất</span>
          <h2><Settings size={20} /> Trang thiết bị</h2>
        </div>
      </div>

      {hasRichText(content) ? (
        <div
          className="clinic-rich-content"
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(content) }}
        />
      ) : (
        <p className="clinic-section__empty">
          Thông tin trang thiết bị đang được cập nhật.
        </p>
      )}
    </section>
  );
}

export default ClinicImages;
