function DoctorFilter() {
    return (
        <div className="listing-filter">
            <div className="listing-filter__field">
                <input
                    type="text"
                    placeholder="Tìm bác sĩ theo tên..."
                />
            </div>

            <div className="listing-filter__row">
                <select className="listing-filter__select">
                    <option>Tất cả chuyên khoa</option>
                    <option>Tim mạch</option>
                    <option>Da liễu</option>
                    <option>Nhi khoa</option>
                    <option>Tai Mũi Họng</option>
                </select>

                <button type="button" className="btn btn-primary listing-filter__btn">
                    Tìm kiếm
                </button>
            </div>
        </div>
    );
}

export default DoctorFilter;
