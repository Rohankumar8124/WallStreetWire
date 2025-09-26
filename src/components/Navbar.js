import React, { Component } from "react";
import { Link } from "react-router";
import "./Navbar.css";

export default class Navbar extends Component {
    render() {
        return (
            <>
                <nav className={`navbar navbar-expand-lg fixed-top bg-${this.props.mode} navbar-${this.props.mode}`}>
                    <div className="container d-flex align-items-center">
                        <Link className="navbar-brand d-flex align-items-center" to="/">
                            <img id="FinFocus-logo" src="brand_logo.png" alt="Logo" draggable="false" height="30" style={{ marginTop: "-5px" }} />
                            <span className="ms-2 fw-bold" style={{ fontSize: "1.2rem", color: this.props.mode === "dark" ? "#40e0d0" : "rgb(55, 55, 55)" }}>The Wall Street Wire</span>
                        </Link>
                        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                            <span className="navbar-toggler-icon"></span>
                        </button>
                        <div className="collapse navbar-collapse" id="navbarSupportedContent">
                            <ul className="navbar-nav ms-auto align-items-center">
                                <li className="nav-item"><Link className="nav-link mx-2" to="/analyze"><i className="fas fa-plus-circle pe-2"></i>[Analyze Stocks]</Link></li>
                                <li className="nav-item"><Link className="nav-link mx-2" to="/"><i className="fas fa-bell pe-2"></i>[News]</Link></li>

                            </ul>
                            <div className="form-switch form-check d-flex align-items-center ms-3">
                                <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                    id="flexSwitchCheckDefault"
                                    onChange={this.props.toggleFunc}
                                    checked={this.props.mode === "dark"}
                                />
                                <label className="form-check-label navbar-text" htmlFor="flexSwitchCheckDefault">
                                    Dark Mode
                                </label>
                            </div>
                        </div>
                    </div>
                </nav>
            </>
        );
    }
}
