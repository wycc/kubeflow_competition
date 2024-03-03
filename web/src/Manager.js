import React, { useEffect, useState } from 'react';
import { Button, Divider, TextField } from '@mui/material';
import { Box } from '@mui/system';
import { LinearProgress } from '@mui/material';
import Markdown from 'react-markdown';
import Paper from '@mui/material/Card';
import ButtonGroup from '@mui/material/ButtonGroup';

const Manager = (props) => {
  const [file, setFile] = useState(null);
  const [url, setURL] = useState('');
  const [STstatus, setStatus] = useState('');
  const [STprogress, setProgress] = useState(false);
  const [STphase, setSTphase] = useState('training');
  useEffect(() => {
    fetch('get_github_competition_phase?competition='+props.competition).then(response => response.json()).then(data => {
      console.log(data);
      if (data['phase'] == null) {
        setSTphase('training');
      } else {
        setSTphase(data['phase']);
      }
    });
  },[]);
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      fetch('/upload-competition', {
        method: 'POST',
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          // Handle the response from the server
          if (data['status'] === 'success') {
            window.location.reload();
          } else {  
            console.log(data);
            alert('Failed to upload the competition: ' + data['status']);
          }
        })
        .catch((error) => {
          // Handle any errors
          console.error(error);
        });
    }
  };

  const handleDelete = () => {
    fetch('/delete-competition', {
      method: 'DELETE',
    })
      .then((response) => response.json())
      .then((data) => {
        // Handle the response from the server
        console.log(data);
        if (data['status'] === 'success') {
          window.location.reload();
        } else {
          alert('Failed to delete the competition: ' + data['status']);
        }
      })
      .catch((error) => {
        // Handle any errors
        console.error(error);
      });
  }
  const add_github_competition = () => {
    setStatus('Uploading the competition');
    setProgress(true);
    fetch('add_github_competition?url='+url).then(response => response.json()).then(data => {
      console.log(data);
      if (data['status'] === 'success') {
        window.location.reload();
        //this.setState({status: 'Competition '+data['competition']+' uploaded successfully'});
      } else {
        alert('Failed to upload the competition: ' + data['status']);
        //this.setState({status: 'Failed to upload the competition: ' + data['status']});
        setProgress(false);
      }
    });
  }
  
  const delete_github_competition = () => {
    setStatus('Deleting the competition');
    setProgress(true);
    fetch('delete_github_competition?competition='+props.competition).then(response => response.json()).then(data => {
      console.log(data);
      if (data['status'] === 'success') {
        window.location.reload();
        //this.setState({status: 'Competition '+data['competition']+' uploaded successfully'});
      } else {
        alert('Failed to upload the competition: ' + data['status']);
        setProgress(false);
        //this.setState({status: 'Failed to upload the competition: ' + data['status']});
      }
    });
  }
  const update_github_competition = () => {
    setStatus('Updating the competition');
    setProgress(true);
    fetch('update_github_competition?competition='+props.competition).then(response => response.json()).then(data => {
      console.log(data);
      if (data['status'] === 'success') {
        window.location.reload();
        //this.setState({status: 'Competition '+data['competition']+' uploaded successfully'});
      } else {
        alert('Failed to upload the competition: ' + data['status']);
        setProgress(false);
        //this.setState({status: 'Failed to upload the competition: ' + data['status']});
      }
    });
  }
  const switch_phase = () => {
    //setStatus('Switching the phase');
    setProgress(true);
    var newphase = STphase === 'training' ? 'testing' : 'training';
    fetch('change_github_competition_phase?competition='+props.competition+'&phase='+newphase).then(response => response.json()).then(data => {
      console.log(data);
      if (data['status'] === 'success') {
        setProgress(false);
        setSTphase(newphase);
        //this.setState({status: 'Competition '+data['competition']+' uploaded successfully'});
      } else {
        alert('Failed to switch the phase: ' + data['status']);
        setProgress(false);
        //this.setState({status: 'Failed to upload the competition: ' + data['status']});
      }
    });
  }

  return (
    <div style={{textAlign:'left'}}>
      <Paper>
        Current competition is {props.competition}, which is hosted at {props.url}. You can update the competition 
        from the github or delete the current competition.
        <br/>
        <Box sx={{display:'flex'}}>
          <ButtonGroup>
            <Button variant="text" onClick={delete_github_competition}>Delete</Button>
            
            <Button variant="text" onClick={update_github_competition}>Update</Button>
          </ButtonGroup>
        </Box>
      </Paper>
      <br/>
      <br/>
      <Paper>
        The behaviour of different phase will be decided by the evaluate.py script in your compeition project.<p/>
        We are in {STphase} now. Do you want to switch to {STphase === 'training' ? 'testing' : 'training'}?
        <br/>
        <Button variant="text" onClick={switch_phase}>Switch</Button>
      </Paper>
      <br/>
      <Paper>
        Please host your competition project on the github and provide the URL here. You need to have
        <ul>
        <li>description.txt
          <ul><li> A description, which will be displayed in the submission page. </li></ul>
        </li>
        <li> evaluation.py
          <ul><li> A script to evalute the submission model file</li></ul>
        </li>
        <li> dataset 
          <ul><li> A folder containing the test dataset</li></ul>
        </li>
        <li>name.txt
          <ul><li> the display name of the competition. The name will be displayed in the dropdown menu of the competition selection.</li></ul>
        </li>
        </ul>
        Please refer to this <a href="https://github.com/wycc/comp1">link</a> as an example.

      </Paper>
      <br/>
      <Paper>
        <TextField id="url" type="text" label={"Input github repository URL here"} style={{width:'100%'}} onChange={
          (e) => setURL(e.target.value)
        }/>
        <br/>
        <br/>

        <Button variant="text" onClick={add_github_competition}>add New Competition</Button>
        &nbsp;&nbsp;
        {STprogress && <Box sx={{width:'100%'}}> <LinearProgress /></Box>}
        {STstatus}
        </Paper>
    </div>
  );
};

export default Manager;
