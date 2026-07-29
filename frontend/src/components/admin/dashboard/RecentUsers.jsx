import { Link } from "react-router-dom";

function RecentUsers() {

    const users = [

        {
            id: 1,
            name: "Nguyễn Văn A",
            email: "vana@gmail.com",
            role: "PATIENT",
            avatar: "https://i.pravatar.cc/100?img=1",
        },

        {
            id: 2,
            name: "Trần Thị B",
            email: "thib@gmail.com",
            role: "DOCTOR",
            avatar: "https://i.pravatar.cc/100?img=2",
        },

        {
            id: 3,
            name: "Lê Văn C",
            email: "vanc@gmail.com",
            role: "PATIENT",
            avatar: "https://i.pravatar.cc/100?img=3",
        },

        {
            id: 4,
            name: "Phạm Thị D",
            email: "thid@gmail.com",
            role: "ADMIN",
            avatar: "https://i.pravatar.cc/100?img=4",
        },

    ];

    function renderRole(role) {

        switch (role) {

            case "ADMIN":

                return (
                    <span className="role admin">

                        Admin

                    </span>
                );

            case "DOCTOR":

                return (
                    <span className="role doctor">

                        Bác sĩ

                    </span>
                );

            default:

                return (
                    <span className="role patient">

                        Bệnh nhân

                    </span>
                );

        }

    }

    return (

        <div className="dashboard-card">

            <div className="dashboard-card-header">

                <h3>

                    Người dùng mới

                </h3>

                <Link
                    to="/admin/users"
                    className="view-all"
                >

                    Xem tất cả

                </Link>

            </div>

            <div className="recent-users">

                {

                    users.map((user) => (

                        <div
                            key={user.id}
                            className="recent-user-item"
                        >

                            <img

                                src={user.avatar}

                                alt={user.name}

                            />

                            <div className="recent-user-info">

                                <h4>

                                    {user.name}

                                </h4>

                                <p>

                                    {user.email}

                                </p>

                            </div>

                            {renderRole(user.role)}

                        </div>

                    ))

                }

            </div>

        </div>

    );

}

export default RecentUsers;