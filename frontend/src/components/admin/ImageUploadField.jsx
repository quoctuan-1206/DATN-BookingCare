import { useState } from "react";
import toast from "react-hot-toast";
import uploadService from "../../services/upload.service";
import { getApiErrorMessage } from "../../api/axios";
import { resolveMediaUrl } from "../../utils/media";

function ImageUploadField({
  label = "Ảnh",
  value = "",
  onChange,
  inputId = "image-upload",
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadService.uploadImage(file);
      onChange?.(url);
      toast.success("Đã tải ảnh lên");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được ảnh"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-form-group">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className="admin-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <small className="admin-upload-hint">
        {uploading ? "Đang tải ảnh..." : "Chọn ảnh từ máy (JPG, PNG, WEBP, GIF — tối đa 5MB)"}
      </small>
      {value ? (
        <div className="admin-upload-preview">
          <img src={resolveMediaUrl(value)} alt="Xem trước" />
        </div>
      ) : null}
    </div>
  );
}

export default ImageUploadField;
