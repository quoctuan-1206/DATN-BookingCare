function ClinicFilter({ search = "", onSearchChange, onSubmit }) {
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
          placeholder="Tìm kiếm phòng khám..."
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>

      <div className="listing-filter__row">
        <button type="submit" className="btn btn-primary listing-filter__btn">
          Tìm kiếm
        </button>
      </div>
    </form>
  );
}

export default ClinicFilter;
