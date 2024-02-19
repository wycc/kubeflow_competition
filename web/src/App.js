import './App.css';
import React, { useEffect } from 'react';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Tab } from '@mui/material';
import { Autocomplete } from '@mui/material';
import { TextField } from '@mui/material';
import Submission from './Submission';
import LeaderBoard from './LeaderBoard';



export default function App() {
  const [value, setValue] = React.useState('1');
  const [selectedCompetition, setSelectedCompetition] = React.useState(null);
  const [competitions, setCompetition] = React.useState([]);
  const [lists, setLists] = React.useState([]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    fetch('competitions')
      .then(response => response.json())
      .then(data => {
        var items = data.map((competition) => { return competition.name});
        setCompetition(data);
        setLists(items);
        setSelectedCompetition(items[0]);
      })
      .catch(error => {
        console.error('Error fetching competitions:', error);
      });
  }, []);

  const handleCompetitionChange = (event, newValue) => {
    setSelectedCompetition(newValue);
  };

  return (
    <div className="App">
      <Autocomplete
        disablePortal
        id="competition"
        options={lists}
        sx={{ width: 300 }}
        value={selectedCompetition}
        onChange={handleCompetitionChange}
        renderInput={(params) => <TextField {...params} label="Movie" />}
      />
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="Submission" value="1" />
            <Tab label="Leader Board" value="2" />
          </TabList>
        </Box>
        <TabPanel value="1">
          <Submission competition={selectedCompetition} />
        </TabPanel>
        <TabPanel value="2">
          <LeaderBoard competition={selectedCompetition}/>
        </TabPanel>
      </TabContext>
    </div>
  );
}
