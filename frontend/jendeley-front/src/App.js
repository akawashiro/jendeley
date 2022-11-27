import React from 'react';
import logo from './logo.svg';
import './App.css';

class App extends React.Component {

  constructor(props){
    super(props);
    this.state = {};
    fetch("http://localhost:5000/")
      .then(response => response.json())
      .then(json => this.state.db = json)
      .then(() => console.log("constructor(): this.state.db.isbn_0596005903.title = ", this.state.db.isbn_0596005903.title));
  }

  render(){
    const title = this.state.db === undefined ? "Not loaderd" : this.state.db.isbn_0596005903.title;
    console.log("render(): this.state.db.isbn_0596005903.title = ", title);
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Hi, {title}. Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
          Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
