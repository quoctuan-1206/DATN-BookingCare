function DoctorFilter({
  search = "",
  specialtyId = "",
  onSearchChange,
  onSpecialtyChange,
  onSubmit,
}) {
  return (
    <form
      className="listing-filter"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <div className="listing-filter__field">
        <input
          type="text"
          placeholder="Tìm bác sĩ theo tên..."
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>

      <div className="listing-filter__row">
        <select
          className="listing-filter__select"
          value={specialtyId}
          onChange={(e) => onSpecialtyChange?.(e.target.value)}
        >
          <option value="">Tất cả chuyên khoa</option>
          <option value="1">Tim mạch</option>
          <option value="2">Da liễu</option>
          <option value="3">Nhi khoa</option>
          <option value="4">Tai Mũi Họng</option>
        </select>

        <button type="submit" className="btn btn-primary listing-filter__btn">
          Tìm kiếm
        </button>
      </div>
    </form>
  );
}

export default DoctorFilter;
