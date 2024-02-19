import React from 'react';

export default class LeaderBoard extends React.Component {
  constructor() {
    // Add your constructor logic here
    super();
    this.state = {
      leaderboard: []
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
      <table><tbody>
        {this.state.leaderboard.map((entry, index) => {
          return (
            <tr key={index}>
              <td style={{width:'100px'}} >{entry.email}</td>
              <td style={{width:'200px'}}>{entry.timestamp}</td>
              <td style={{width:'100px'}}>{entry.accurancy}</td>
            </tr>
          );
        }
        )}
      </tbody></table>
    );
  }
}
