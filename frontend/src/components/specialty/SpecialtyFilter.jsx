function SpecialtyFilter() {
    return (
        <div className="listing-filter">
            <div className="listing-filter__field">
                <input
                    type="text"
                    placeholder="Tìm kiếm chuyên khoa..."
                />
            </div>

            <div className="listing-filter__row">
                <select className="listing-filter__select">
                    <option>Tất cả tỉnh thành</option>
                    <option>Hồ Chí Minh</option>
                    <option>Hà Nội</option>
                    <option>Đà Nẵng</option>
                    <option>Cần Thơ</option>
                </select>

                <button type="button" className="btn btn-primary listing-filter__btn">
                    Tìm kiếm
                </button>
            </div>
        </div>
    );
}

export default SpecialtyFilter;
