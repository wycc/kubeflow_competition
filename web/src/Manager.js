import React, { useState } from 'react';

const Manager = () => {
  const [file, setFile] = useState(null);

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

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
};

export default Manager;
