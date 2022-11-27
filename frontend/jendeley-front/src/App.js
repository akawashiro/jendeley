import React from 'react';

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
            });
    }

    render() {
        // const title = this.state.db === undefined ? "Not loaderd" : this.state.db.isbn_0596005903.title;
        // console.log("render(): this.state.db.isbn_0596005903.title = ", title);
        // const message = this.state.db_fetching ? "fetching" : "fetched";
        // const title = this.state.db_fetching ? "N/A" : this.state.db.isbn_0596005903.title;

        if (this.state.db_fetching) {
            return (
                <p>
                    Fetching DB.
                </p>
            );
        } else {
            return (
                <p>
                    Fetched DB.
                </p>
            );
        }
    }
}

export default App;
