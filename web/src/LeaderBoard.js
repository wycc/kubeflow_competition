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
  componentDidMount() {
    // fetch data from the /leaderboard
    this.timer = setInterval(() => {
      fetch('leaderboard?competition='+this.props.competition)
        .then(response => response.json())
        .then(data => {
          console.log('Leaderboard data:', data);
          this.setState({
            leaderboard: data
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
        <Paper>
          Training phase results:
          <br/>

          <table><tbody>
            {this.state.leaderboard['training'].slice(0,20).map((entry, index) => {
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
        <br/>
        <br/>
        <Paper>
          Tetsing phase results:
          <br/>

          <table><tbody>
            {this.state.leaderboard['testing'].slice(0,20).map((entry, index) => {
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
    );
  }
}
