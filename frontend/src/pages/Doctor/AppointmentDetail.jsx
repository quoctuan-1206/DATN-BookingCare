import { useParams } from "react-router-dom";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";

function AppointmentDetail() {
    const { id } = useParams();

    return (
        <DoctorLayout title="Chi tiết lịch hẹn">
            <div className="doctor-placeholder">
                <h3>Chi tiết lịch hẹn #{id}</h3>
                <p>Giao diện chi tiết sẽ được cập nhật sau.</p>
            </div>
        </DoctorLayout>
    );
}

export default AppointmentDetail;
