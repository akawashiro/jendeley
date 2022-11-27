import React from 'react';
import logo from './logo.svg';
import './App.css';

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
        this.state.db = {};
        this.state.db_fetching = true;
        fetch("http://localhost:5000/")
            .then(response => response.json())
            .then(json => {
                this.setState(state => ({
                    db_fetching: false,
                    db: json,
                }));
                // console.log("constructor(): this.state.db.isbn_0596005903.title = ", this.state.db.isbn_0596005903.title);
            });
    }

    render() {
        // const title = this.state.db === undefined ? "Not loaderd" : this.state.db.isbn_0596005903.title;
        // console.log("render(): this.state.db.isbn_0596005903.title = ", title);
        const message = this.state.db_fetching ? "fetching" : "fetched";
        const title = this.state.db_fetching ? "N/A" : this.state.db.isbn_0596005903.title;
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <p>
                        Hi, {message}, {title}. Edit <code>src/App.js</code> and save to reload.
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
