import { Divider, LinearProgress } from '@mui/material';
import React from 'react';
import { Box } from '@mui/system';
import Markdown from 'react-markdown';
import Paper from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Item from '@mui/material/ListItem';
import Card from '@mui/material/Card';
export default class Submission extends React.Component {
  constructor() {
    super();
    // Add your constructor logic here
    this.state = {
      selectedFile: null,
      status:'Upload your model here',
      progress: false,
      description:''
    };
  }
  
  handleFileChange = (event) => {
    this.setState({
      selectedFile: event.target.files[0]
    });
  }

  handleFileUpload = () => {
    // Logic to upload the file goes here
    const { selectedFile } = this.state;
    // Perform the file upload operation
    // use upload-submission endpoint
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('competition', this.props.competition);
    this.setState({progress: true });
    fetch('upload-submission', {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        console.log('File uploaded successfully:', data);
        this.setState({
          status: data['status'], progress: false
        });
      })
      .catch(error => {
        console.error('Error uploading file:', error);
        this.setState({
          status: 'Error uploading file', progress: false
        });
      });
    console.log('Uploading file:', selectedFile);

  }

  render() {
    var h = window.innerHeight-185;
    if (this.props.competition == null) {
      return (
        <div>
          <h1>Competition not found</h1>
        </div>
      );
    }
    return (
      <div style={{textAlign:'left'}}>
        <Stack spacing={2}>
          <Item>
            <Card>
                {this.state.progress && <Box sx={{width:'100%'}}> <LinearProgress /></Box>}
                <div style={{paddingLeft:'20px',paddingRight:'20px',fontSize:'24px',color:'white',backgroundColor:'ActiveCaption'}}>{this.state.status}</div>
                <Divider />
                <input type="file" onChange={this.handleFileChange} />
                <br />
                <button onClick={this.handleFileUpload}>Upload</button>
            </Card>
          </Item>
          <Item>
            <Paper elevation={12}>
              <div style={{textAlign:'center',fontSize:'24px',backgroundColor:'ActiveCaption',color:'white'}}>{this.props.competition}</div>
              <Divider />
              <div style={{overflowY:'scroll',height:h,backgroundColor:'#ddd',textAlign: 'left'}}>
                <div>
                  <Markdown>{this.props.description}</Markdown>
                </div>
              </div>
            </Paper>
          </Item>
        </Stack>
      </div>
    );
  }
}

