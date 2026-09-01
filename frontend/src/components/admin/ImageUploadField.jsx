import { useRef, useState } from "react";
import toast from "react-hot-toast";
import uploadService from "../../services/upload.service";
import { getApiErrorMessage } from "../../api/axios";
import { resolveMediaUrl } from "../../utils/media";
import ImageCropModal from "./ImageCropModal";

function ImageUploadField({
  label = "Ảnh",
  value = "",
  onChange,
  inputId = "image-upload",
  aspect = 1.5,
  shape = "rect",
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState("");

  const openPicker = () => inputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }
    setCropSrc(URL.createObjectURL(file));
  };

  const closeCrop = () => {
    if (cropSrc.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
    setCropSrc("");
  };

  const handleApply = async (blob) => {
    setUploading(true);
    try {
      const file = new File([blob], "image.jpg", { type: "image/jpeg" });
      const url = await uploadService.uploadImage(file);
      onChange?.(url);
      toast.success("Đã cập nhật ảnh");
      closeCrop();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được ảnh"));
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const previewStyle = {
    aspectRatio: String(aspect),
    width: shape === "circle" ? 140 : 220,
    height: "auto",
    borderRadius: shape === "circle" ? "50%" : 10,
  };

  return (
    <div className="admin-form-group">
      <label htmlFor={inputId}>{label}</label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={uploading}
        hidden
      />
      {!value ? (
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={openPicker}
          disabled={uploading}
        >
          Chọn ảnh
        </button>
      ) : null}
      <small className="admin-upload-hint">
        {uploading
          ? "Đang tải ảnh..."
          : "Chọn ảnh rồi kéo / zoom để lấy khung hiển thị (giống Facebook)"}
      </small>

      {value ? (
        <div className="admin-upload-preview-wrap">
          <div className="admin-upload-preview" style={previewStyle}>
            <img src={resolveMediaUrl(value)} alt="Xem trước" />
          </div>
          <div className="admin-upload-preview-actions">
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setCropSrc(resolveMediaUrl(value))}
              disabled={uploading}
            >
              Điều chỉnh
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={openPicker}
              disabled={uploading}
            >
              Đổi ảnh
            </button>
          </div>
        </div>
      ) : null}

      {cropSrc ? (
        <ImageCropModal
          src={cropSrc}
          aspect={aspect}
          shape={shape}
          onCancel={closeCrop}
          onApply={handleApply}
        />
      ) : null}
    </div>
  );
}

export default ImageUploadField;
