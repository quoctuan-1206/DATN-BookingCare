import { Search, X } from "lucide-react";

function ClinicFilter({ search = "", onSearchChange, onClear }) {
  return (
    <div className="clinic-search-box">
      <Search size={18} className="clinic-search-icon" />
      <input
        type="search"
        className="clinic-search-input"
        placeholder="Tìm theo tên, địa chỉ hoặc số điện thoại..."
        aria-label="Tìm kiếm phòng khám"
        value={search}
        onChange={(event) => onSearchChange?.(event.target.value)}
      />
      {search && (
        <button
          type="button"
          className="clinic-search-clear"
          aria-label="Xóa nội dung tìm kiếm"
          onClick={onClear}
        >
          <X size={17} />
        </button>
      )}
    </div>
  );
}

export default ClinicFilter;
