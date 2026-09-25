import { useState } from "react";
import { CalendarDays, Save } from "lucide-react";
import toast from "react-hot-toast";
import medicalRecordService from "../../services/medical-record.service";
import { getApiErrorMessage } from "../../api/axios";
import "../../styles/follow-up-card.css";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function dateAfterDays(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidFollowUpDate(value) {
  if (!value) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${value}T00:00:00`);
  const days = Math.ceil((target.getTime() - today.getTime()) / DAY_IN_MS);
  return Number.isInteger(days) && days >= 1 && days <= 365;
}

function FollowUpCard({ medicalRecord, onSaved, readOnly = false }) {
  const initialDate = medicalRecord?.follow_up_date || "";
  const [enabled, setEnabled] = useState(Boolean(initialDate));
  const [followUpDate, setFollowUpDate] = useState(
    initialDate || dateAfterDays(7),
  );
  const [saving, setSaving] = useState(false);

  if (!medicalRecord?.id) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (enabled && !isValidFollowUpDate(followUpDate)) {
      toast.error("Ngày tái khám phải trong vòng 365 ngày tới");
      return;
    }

    setSaving(true);
    try {
      const updated = await medicalRecordService.update(medicalRecord.id, {
        follow_up_date: enabled ? followUpDate : null,
      });
      toast.success(enabled ? "Đã lưu lịch tái khám" : "Đã bỏ lịch tái khám");
      onSaved?.(updated);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không lưu được lịch tái khám"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="doctor-card doctor-follow-up-card">
      <form onSubmit={handleSubmit}>
        <div className="doctor-follow-up-card__heading">
          <span className="doctor-follow-up-card__icon" aria-hidden="true">
            <CalendarDays size={20} />
          </span>
          <div>
            <h3>Hẹn tái khám</h3>
          </div>
        </div>

        {readOnly ? (
          <div className="doctor-follow-up-card__readonly">
            <span>Ngày tái khám</span>
            <strong>{medicalRecord.follow_up_date_display || "Không hẹn tái khám"}</strong>
          </div>
        ) : (
          <div className="doctor-follow-up-card__controls">
            <label className="doctor-follow-up-card__toggle">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => setEnabled(event.target.checked)}
              />
              <span>Cần hẹn tái khám</span>
            </label>

            <label
              className={`doctor-follow-up-card__date${enabled ? "" : " is-disabled"}`}
              htmlFor="medical_record_follow_up_date"
            >
              <span>Ngày tái khám</span>
              <input
                id="medical_record_follow_up_date"
                type="date"
                min={dateAfterDays(1)}
                max={dateAfterDays(365)}
                value={followUpDate}
                disabled={!enabled}
                onChange={(event) => setFollowUpDate(event.target.value)}
                required={enabled}
              />
            </label>

            <button
              type="submit"
              className="doctor-follow-up-card__save"
              disabled={saving}
            >
              <Save size={16} />
              {saving ? "Đang lưu..." : "Lưu lịch tái khám"}
            </button>
          </div>
        )}
      </form>
    </section>
  );
}

export default FollowUpCard;
