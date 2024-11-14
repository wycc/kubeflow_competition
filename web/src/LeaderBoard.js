import React from 'react';
import Paper from '@mui/material/Card';

export default class LeaderBoard extends React.Component {
  constructor() {
    // Add your constructor logic here
    super();
    this.state = {
      leaderboard: {'training':[],'testing':[]}
    };
  }
  componentWillUnmount() {
    clearInterval(this.timer);
  }
  keepOnePerUser(datas) {
    var users={};
    var data1 = datas['training'];
    // find all users
    for (var i = 0; i < data1.length; i++) {
      if (users[data1[i].email]) {
        if (users[data1[i].email]['accurancy'] < data1[i].accurancy) {
          users[data1[i].email] = {'timestamp':data1[i].timestamp, 'accurancy': data1[i].accurancy, 'email':data1[i].email};
        }
      } else {
        users[data1[i].email] = {'timestamp':data1[i].timestamp, 'accurancy':data1[i].accurancy, 'email':data1[i].email};
      }
    }
    var res = {'training':[],'testing':[]};
    var email;
    // convert all users into items in an array
    for (email in users) {
      res['training'].push(users[email]);
    }

    var data1 = datas['testing'];
    users={};
    // find all users
    for (var i = 0; i < data1.length; i++) {
      if (users[data1[i].email]) {
        if (users[data1[i].email]['accurancy'] < data1[i].accurancy) {
          users[data1[i].email] = {'timestamp':data1[i].timestamp, 'accurancy': data1[i].accurancy, 'email':data1[i].email};
        }
      } else {
        users[data1[i].email] = {'timestamp':data1[i].timestamp, 'accurancy':data1[i].accurancy, 'email':data1[i].email};
      }
    }
    for (email in users) {
      res['testing'].push(users[email]);
    }
    return res;
  }
  componentDidMount() {
    // fetch data from the /leaderboard
    this.timer = setInterval(() => {
      fetch('leaderboard?competition='+this.props.competition)
        .then(response => response.json())
        .then(data => {
          console.log('Leaderboard data:', data);
          this.setState({
            leaderboard: this.keepOnePerUser(data)
          });
        })
        .catch(error => {
          console.error('Error fetching leaderboard:', error);
        });
      },1000);
  }
  // Add your methods here
  render() {
    return (
      <div>
        <div style={{height:'300px',overflow:'auto'}}>
          <Paper>
            Training phase results:
            <br/>

            <table><tbody>
              {this.state.leaderboard['training'].slice(0,40).map((entry, index) => {
                var date = new Date(entry.timestamp).toLocaleDateString()+" "+new Date(entry.timestamp).toLocaleTimeString();
                return (
                  <tr key={index}>
                    <td style={{width:'100px'}} >{index+1}</td>
                    <td style={{width:'100px'}} >{entry.email}</td>
                    <td style={{width:'200px'}}>{date}</td>
                    <td style={{width:'100px'}}>{entry.accurancy}</td>
                  </tr>
                );
              }
              )}
            </tbody></table>
          </Paper>
        </div>
        <div style={{height:'300px',overflow:'auto'}}>
          <Paper>
            Tetsing phase results:
            <br/>

            <table><tbody>
              {this.state.leaderboard['testing'].slice(0,40).map((entry, index) => {
                var date = new Date(entry.timestamp).toLocaleDateString()+" "+new Date(entry.timestamp).toLocaleTimeString();
                return (
                  <tr key={index}>
                    <td style={{width:'100px'}} >{index+1}</td>
                    <td style={{width:'100px'}} >{entry.email}</td>
                    <td style={{width:'200px'}}>{date}</td>
                    <td style={{width:'100px'}}>{entry.accurancy}</td>
                  </tr>
                );
              }
              )}
            </tbody></table>
          </Paper>
          
        </div>
      </div>
    );
  }
}
