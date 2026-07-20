function PageBanner({ title, description, variant = "default" }) {
    return (
        <div className={`listing-hero listing-hero--${variant}`}>
            <div className="container">
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
        </div>
    );
}

export default PageBanner;
