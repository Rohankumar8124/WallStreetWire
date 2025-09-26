import React, { Component } from 'react';

class Newsitem extends Component {
    render() {
        const { article } = this.props; 
        return (
            <div
                className="card"
                style={{
                    width: '18rem',
                    height: '25rem',
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: this.props.mode === "dark" ? "#2f2f2f" : "white",
                    color: this.props.mode === "dark" ? "white" : "black",
                    border: this.props.mode === "dark" ? "2px solid #40e0d0" : ""
                }}
            >
                <img
                    src={article.urlToImage}
                    className="card-img-top"
                    alt="Article"
                    style={{ height: '10rem', objectFit: 'cover' }}
                />
                <div className="card-body" style={{ height: 'calc(100% - 10rem)', display: 'flex', flexDirection: 'column' }}>
                    <h5 className="card-title" style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {article.title}
                    </h5>
                    <p className="card-text" style={{
                        fontSize: '0.9rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 5,
                        WebkitBoxOrient: 'vertical',
                        flexGrow: 1
                    }}>
                        {article.description}
                    </p>
                    <a
                        href={article.url}
                        className={`btn mt-auto ${this.props.mode === "dark" ? "btn-turquoise" : "btn-primary"}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            backgroundColor: this.props.mode === "dark" ? "rgb(75, 121, 221)" : "rgb(43, 75, 145)", // Turquoise color in dark mode
                            color: this.props.mode === "dark" ? "white" : "" // White text in dark mode
                        }}
                    >
                        Read More
                    </a>
                </div>
            </div>
        );
    }
}

export default Newsitem;
