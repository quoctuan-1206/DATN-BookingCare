import { Link } from "react-router-dom";

function AuthFooter({

    text,

    linkText,

    to,

}) {

    return (

        <div className="auth-footer">

            <span>

                {text}

            </span>

            <Link to={to}>

                {linkText}

            </Link>

        </div>

    );

}

export default AuthFooter;