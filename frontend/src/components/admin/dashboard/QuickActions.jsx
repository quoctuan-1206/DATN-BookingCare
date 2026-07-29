import { Link } from "react-router-dom";
import {
    UserRound,
    Hospital,
    Stethoscope,
    CalendarPlus,
    Users,
    Newspaper,
} from "lucide-react";

function QuickActions() {

    const actions = [

        {
            title: "Thêm bác sĩ",
            icon: <UserRound size={28} />,
            link: "/admin/doctors/create",
            color: "#3b82f6",
        },

        {
            title: "Thêm phòng khám",
            icon: <Hospital size={28} />,
            link: "/admin/clinics/create",
            color: "#10b981",
        },

        {
            title: "Thêm chuyên khoa",
            icon: <Stethoscope size={28} />,
            link: "/admin/specialties/create",
            color: "#f59e0b",
        },

        {
            title: "Quản lý lịch hẹn",
            icon: <CalendarPlus size={28} />,
            link: "/admin/appointments",
            color: "#ef4444",
        },

        {
            title: "Quản lý người dùng",
            icon: <Users size={28} />,
            link: "/admin/users",
            color: "#8b5cf6",
        },

        {
            title: "Viết bài mới",
            icon: <Newspaper size={28} />,
            link: "/admin/articles/create",
            color: "#06b6d4",
        },

    ];

    return (

        <div className="quick-actions">

            <div className="dashboard-card-header">

                <h3>Thao tác nhanh</h3>

            </div>

            <div className="quick-actions-grid">

                {

                    actions.map((item, index) => (

                        <Link

                            key={index}

                            to={item.link}

                            className="quick-action-card"

                        >

                            <div

                                className="quick-action-icon"

                                style={{

                                    backgroundColor: item.color,

                                }}

                            >

                                {item.icon}

                            </div>

                            <h4>

                                {item.title}

                            </h4>

                        </Link>

                    ))

                }

            </div>

        </div>

    );

}

export default QuickActions;