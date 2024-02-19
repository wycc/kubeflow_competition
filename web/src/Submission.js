import React from 'react';

export default class Submission extends React.Component {
  constructor() {
    super();
    // Add your constructor logic here
    this.state = {
      selectedFile: null,
      status:'Upload your file here'
    };
  }

  // Add your methods here

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
    
    fetch('upload-submission', {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        console.log('File uploaded successfully:', data);
        this.setState({
          status: data['status']
        });
      })
      .catch(error => {
        console.error('Error uploading file:', error);
      });
    console.log('Uploading file:', selectedFile);

  }

  render() {
    return (
      <div>
        <input type="file" onChange={this.handleFileChange} />
        <button onClick={this.handleFileUpload}>Upload</button>
        <div>
          {this.state.status}
        </div>
      </div>
    );
  }
}

