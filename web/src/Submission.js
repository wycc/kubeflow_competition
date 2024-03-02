import { LinearProgress } from '@mui/material';
import React from 'react';
import { Box } from '@mui/system';
import Markdown from 'react-markdown';
export default class Submission extends React.Component {
  constructor() {
    super();
    // Add your constructor logic here
    this.state = {
      selectedFile: null,
      status:'Upload your file here',
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
    return (
      <div>
        <input type="file" onChange={this.handleFileChange} />
        <button onClick={this.handleFileUpload}>Upload</button>
        <div>
          {this.state.progress && <Box sx={{width:'100%'}}> <LinearProgress /></Box>}
          {this.state.status}
        </div>
        <div style={{overflowY:'scroll',height:h,backgroundColor:'#ddd',textAlign: 'left'}}>
          <div>
            <Markdown>{this.props.description}</Markdown>
          </div>
        </div>
      </div>
    );
  }
}

