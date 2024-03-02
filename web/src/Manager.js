import React, { useState } from 'react';
import { Button, TextField } from '@mui/material';
import { Box } from '@mui/system';
import { LinearProgress } from '@mui/material';
import Markdown from 'react-markdown';
const Manager = (props) => {
  const [file, setFile] = useState(null);
  const [url, setURL] = useState('');
  const [STstatus, setStatus] = useState('');
  const [STprogress, setProgress] = useState(false);

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

  return (
    <div style={{textAlign:'left'}}>
      <div>
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
      </div>
      <TextField id="url" type="text" label={"URL"} style={{width:'100%'}} onChange={
        (e) => setURL(e.target.value)
      }/>
      <br/>
      <Button variant="contained" onClick={add_github_competition}>add New Competition</Button>
      &nbsp;&nbsp;
      <Button variant="contained" onClick={delete_github_competition}>Delete current Competition</Button>
      {STprogress && <Box sx={{width:'100%'}}> <LinearProgress /></Box>}
      {STstatus}
    </div>
  );
};

export default Manager;
