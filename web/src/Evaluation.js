import React, { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';

const Evaluation = (props) => {
  const [Code, setCode] = useState('');
  const [file, setFile] = useState('train');

  useEffect(() => {
    // Fetch train.py and evaluate.py files from /data/competitions/XXX folder
    fetch('file?path='+file+'&competition='+props.competition)
      .then((response) => response.text())
      .then((data) => setCode("\`\`\`\n"+data+"\n\`\`\`\n"));

  }, [file, props.competition]);
  var newfile;
  if (file==='train'){
    newfile='evaluate'
  } else {
    newfile='train'
  }
  var h = window.innerHeight-185;
  const downloadFile = (file) => {
    fetch('file?path='+file+'&competition='+props.competition)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file+'.py');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      });
  };
  var filedescription;
  if (file==='train'){
    filedescription = 'This scipty is used to train the model. You can use it as the template for your solution. Please make sure to keep the input and output format as it is.'
  } else {
    filedescription = 'This script is used to evaluate your submission. You can use it to evaluate your model outside the competition.'
  }
  return (
    <div style={{textAlign:'left'}}>
      <Paper>
        <div style={{backgroundColor:'white'}}>
          {filedescription} <br/>
          <a href="#" onClick={() => setFile(newfile)}>Switch to {newfile}.py</a>   
          &nbsp;&nbsp;
          <Button variant="text" color="primary" onClick={() => downloadFile(file)}>Download</Button>
        </div>
        <Divider />
        <div style={{textAlign:'center',backgroundColor:'black',color:'white'}}>{file}.py</div>
        <Divider />
        <div style={{height:(h+'px'),textAlign:'left',overflow:'auto',backgroundColor:'azure'}}>
          <Markdown>{Code}</Markdown>
        </div>
      </Paper>
    </div>
  );
};

export default Evaluation;
