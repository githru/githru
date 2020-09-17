import React, { Component } from 'react';


class Home extends Component {
    state = {
        id: ''
      }
      appChange = (e) => {
        this.setState({
          id: e.target.value
        });
      }

      appClick = () => {
        window.open(window.location.href + "v2/" + this.state.id, "_self");
      }
      render() {
        const { id } = this.state;
        const { appChange, appClick } = this;
        return (
          <div className="App">
            <header className="App-header">
              <input type="text" placeholder="Repository name" value={id} onChange={appChange} />
              <button onClick={appClick}>Open!!</button>
            </header>
          </div>
        );
      }
}


export default Home;