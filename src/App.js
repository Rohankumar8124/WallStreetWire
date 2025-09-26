import './App.css';
import Analyzer from './components/Analyzer';
import Navbar from './components/Navbar';
import News from './components/News';
import { BrowserRouter, Routes, Route } from 'react-router';

import React, { Component } from 'react'

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      mode: "light"
    }
  }
  toggleMode = () => {
    this.setState({ mode: this.state.mode === "light" ? "dark" : "light" });
    document.body.style.backgroundColor = this.state.mode === "light" ? "#181818" : "white";
  };
  render() {
    return (
      <BrowserRouter>
        <Navbar mode={this.state.mode} toggleFunc={this.toggleMode} />
        <Routes>
          <Route
            exact path='/'
            element={<News mode={this.state.mode} />}
          />
          <Route
            exact path="/analyze"
            element={<Analyzer mode={this.state.mode} />}
          />
        </Routes>
      </BrowserRouter>
    )
  }
}
