import { Search, X } from "lucide-react";

function ClinicFilter({ search = "", onSearchChange, onClear, onSubmit }) {
  return (
    <form className="clinic-search-box" onSubmit={onSubmit} role="search">
      <Search size={18} className="clinic-search-icon" />
      <input
        type="search"
        className="clinic-search-input"
        placeholder="Tìm theo tên, địa chỉ, email hoặc số điện thoại..."
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
      <button className="clinic-search-submit" type="submit">Tìm kiếm</button>
    </form>
  );
}

export default ClinicFilter;
