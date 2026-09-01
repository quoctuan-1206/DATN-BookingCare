function StatCard({

    title,

    value,

    icon,

    color = "#2E8B57",

    change,

}) {

    return (

        <div className="stat-card">

            <div className="stat-card-icon"

                style={{

                    backgroundColor: color,

                }}

            >

                {icon}

            </div>

            <div className="stat-card-content">

                <h4>

                    {title}

                </h4>

                <h2>

                    {typeof value === "number"
                        ? value.toLocaleString("vi-VN")
                        : value}

                </h2>

                {

                    change && (

                        <p className="stat-card-change">

                            {change}

                            <span>

                                so với tháng trước

                            </span>

                        </p>

                    )

                }

            </div>

        </div>

    );

}

export default StatCard;