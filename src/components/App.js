import React, { Component } from 'react';
import {Route,Switch,Redirect} from 'react-router-dom';
import '../App.css';
import Dashboard from './Dashboard'
import {Logout} from './Logout';
import Login from './Login'
import Header from './Header'
import ProtectedRoute from './common/ProtectedRoute'
import {getCurrentUser} from "../services/loginService";
import logger from "../services/logService"

class App extends Component {

  state = {}

  componentDidMount() {
    const user = getCurrentUser();
    this.setState({user})
  }

  componentDidCatch(error, errorInfo) {
   logger.logError(error)
  }
  
  render() {
    
    return (
      <React.Fragment>
      <Header user = {this.state.user} />
      
      <ProtectedRoute path ="/dashboard" component={Dashboard} />
      <Route path="/login" component={Login} />
     {/* <Route path="/forcepassword" component={Forcepassword} />
      <Route path="/forgotpassword" component={Forgotpassword} />
      <ProtectedRoute authed={isUserAuthenticated()} path="/Timelog" component={TimelogPage} />
      <ProtectedRoute authed={isUserAuthenticated()} path="/Usermanagement" component={UserManagement}/>
      <ProtectedRoute authed={isUserAuthenticated()} path="/UpdatePassword" component={UpdatePassword}/> */}
      <Route path="/Logout" component={Logout} />
      {/* <Redirect from="/" exact to="/dashboard" /> */}
      <ProtectedRoute path = "/" exact component = {Dashboard}/>
      {/* <Route component={NoMatch} /> */}
     

    </React.Fragment>
    );
  }
}


export default App;
