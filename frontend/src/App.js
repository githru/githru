import React from 'react';
import v2 from './AppV2';
import Home from './Home';
import { Route, Switch } from 'react-router-dom';


class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <Switch>
                <Route exact path="/" component = { Home }/>
                <Route path = "/v2/:repo/:releasePrefix/:mainStemBranchName" component = { v2 }/>
                <Route path = "/v2/:repo/:releasePrefix" component = { v2 }/>
                <Route path = "/v2/:repo/" component = { v2 }/>
            </Switch>
        );
    }
}

export default App;
