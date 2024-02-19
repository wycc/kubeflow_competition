import React from 'react';
import React, { useState } from 'react';
import React, { useState, useEffect } from 'react';

const Compitition = () => {
  const [state, setState] = useState({
    compititions: []
  });

  useEffect(() => {
    fetch('/competition')
      .then(response => response.json())
      .then(data => {
        setState(prevState => ({
          ...prevState,
          compititions: data
        }));
      })
      .catch(error => {
        console.error('Error fetching compititions:', error);
      });
  }, []);

  // Your component code here
  onEnter = (competition) => {
    
  }
  return (
    <div style={{height:'400px'}}>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {state.compititions.map(competition => (
            <tr key={competition.name} style={{pointer:'cursor'}} onClick={ () => {onEnter(competition) }}>
              <td>{competition.name}</td>
              <td>{competition.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Compitition;
