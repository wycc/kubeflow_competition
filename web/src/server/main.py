import sqlite3
from flask import Flask, render_template, request, jsonify
from flask import send_from_directory
import torch
from torchvision import datasets, transforms
import sqlite3
from flask import Flask, request
import os
import json
import traceback
import kubernetes

# Connect to the database
conn = sqlite3.connect('/data/database.db')

# Create a cursor object
cursor = conn.cursor()

# Execute SQL queries
# ...
# create table with id, timestamp, name, email
cursor.execute('''
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competition TEXT,               
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email TEXT,
  accurancy REAL          
)
''')

# Close the cursor and connection
cursor.close()
conn.close()


app = Flask(__name__, static_folder='/app', static_url_path='/')

def detect_manager(email):
  # search for profile by use the email by using kubernetes client API
  #load the kubeconfig
  try:
    kubernetes.config.load_kube_config()
  except:
    app.logger.warning("Failed to load kubeconfig, load cluster instead")
    try:
      kubernetes.config.load_incluster_config()
    except:
      app.logger.warning("Failed to load incluster config")
      return False
  # create the kubernetes client
  api_instance = kubernetes.client.CustomObjectsApi()
  # search for the profile by email
  try:
    profile = api_instance.list_cluster_custom_object(    
      group="kubeflow.org",
      version="v1beta1",
      plural="profiles"
    )
    # search for the manager by the email
    #app.logger.warning("XXXX")
    #app.logger.warning(profile)
    for user in profile['items']:
      print(user)
      try:
        if user['spec']['owner']['name'] == email:
          return user["metadata"]["annotations"]["manager"] == "manager"
      except:
        pass
  except Exception as e:
    app.logger.warning(e)
  return False


@app.route('/')
def static_root():
  return send_from_directory('/app', 'index.html')
@app.route('/manager')
def static_manager():
  email = request.headers.get('kubeflow-userid')  
  manager = detect_manager(email)
  return json.dumps(manager)

@app.route('/description', methods=['GET'])
def description():
  competition = request.args.get('competition')
  description_file = '/data/competitions/%s/description.txt' % competition
  with open(description_file, 'r') as f:
    description = f.read().strip()
  return description

@app.route('/upload-competition', methods=['POST'])
def upload_competition():
  file = request.files['file']
  print(file.filename)
  try:
    competition = request.form['competition']
    path = '/data/competitions/%s' % competition
    if os.path.exists(path):
      return {"status": "Error: competition already exists"}
    os.makedirs(path)
    file.save('/server/uploads/' + file.filename)
    # decompress the tgz file
    os.system('tar -xzf /server/uploads/%s -C %s' % (file.filename, path))
    # check if the description.txt exist
    description_file = os.path.join(path, 'description.txt')
    if not os.path.isfile(description_file):
      return {"status": "Error: description.txt not found"}
    # check if the evaluate.opy exist
    evaluate_file = os.path.join(path, 'evaluate.py')
    if not os.path.isfile(evaluate_file):
      return {"status": "Error: evaluate.py not found"}
  except:
    print(traceback.format_exc())
    return {"status": "Error: competition not specified"}

@app.route('/delete-competition', methods=['POST'])
def delete_competition():
  try:
    competition = request.form['competition']
    path = '/data/competitions/%s' % competition
    if not os.path.exists(path):
      return {"status": "Error: competition does not exist"}
    shutil.rmtree(path)
    return {"status": "Competition deleted successfully"}
  except:
    print(traceback.format_exc())
    return {"status": "Error: competition not specified"}
  return {"status": "success"}


@app.route('/upload-submission', methods=['POST'])
def upload_submission():
  # save the upload file to the file system
  file = request.files['file']
  print(file.filename)
  try:
    competition = request.form['competition']
  except:
    print(traceback.format_exc())
    return {"status": "Error: competition not specified"}
  file.save('/server/uploads/' + file.filename)
  print(competition)
  email = request.headers.get('kubeflow-userid')  
  manager = detect_manager(email)
  # Check if this is a PyTorch weights file
  if file.filename.endswith('.pth'):
    try:
      # Attempt to load the file using torch.load
      # model = torch.load('uploads/' + file.filename)
      model_name = '/server/uploads/' + file.filename
      os.chdir('/data/competitions/%s' % competition)
      cmd = 'python3 /data/competitions/%s/evaluate.py %s' % (competition, model_name)
      # execute cmd and get the result
      result = json.loads(os.popen(cmd).read())
      
    except Exception as e:
      # If an exception occurs, return an error
      return {"status": "Error loading PyTorch weights file: " + str(e)}
    
    #result = evaluate_model(model)
    print(result)
    # Insert the submission record into the leaderboard table
    # request.form['email']
    try:
      conn = sqlite3.connect('/data/database.db')
      cursor = conn.cursor()
      cursor.execute('''
        INSERT INTO submissions (competition,email, accurancy)
        VALUES (?, ?,?)
      ''', (competition,email, result['accurancy']))
      conn.commit()
      cursor.close()
      conn.close()
    except Exception as e:
      print(e)
      return {"status": "Error inserting record into the leaderboard: " + str(e)}
    
    return result
  else:
    # Return error if the file is not a PyTorch weights file
    return {"status": "File is not a PyTorch weights file"}

def evaluate_model(model):
  # Evaluate the model
  # Load test dataset
  dataset_dir = 'dataset'
  transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Grayscale(num_output_channels=1),
    transforms.Normalize((0.5,), (0.5,)),
    transforms.Lambda(lambda x: torch.flatten(x))
  ])
  test_dataset = datasets.ImageFolder(dataset_dir, transform=transform)
  test_dataloder = torch.utils.data.DataLoader(test_dataset, batch_size=32)

  # iterate all batches on the dataset
  correct = 0
  total = 0
  for images, labels in test_dataloder:
    #print(images.shape)
    outputs = model(images)
    _, predicted = torch.max(outputs, 1)
    total += labels.size(0)
    correct += (predicted == labels).sum().item()

  # Return evaluation result

  return {"total": total, "correct": correct, "accurancy": correct / total * 100, "status": "success %g" % (correct / total * 100)}



@app.route('/competitions', methods=['GET'])
def competitions():
  competitions_dir = '/data/competitions'
  competition_list = []

  # Iterate over the folders in the competitions directory
  for folder_name in os.listdir(competitions_dir):
    folder_path = os.path.join(competitions_dir, folder_name)
    if os.path.isdir(folder_path):
      description_file = os.path.join(folder_path, 'description.txt')
      print(description_file)
      if os.path.isfile(description_file):
        with open(description_file, 'r') as f:
          description = f.read().strip()
          competition_list.append({
            'name': folder_name,
            'description': description
          })
  print(competition_list)
  return jsonify(competition_list)


@app.route('/leaderboard', methods=['GET'])
def leaderboard():
  competition = request.args.get('competition')
  # Fetch data from the leaderboard
  conn = sqlite3.connect('/data/database.db')
  cursor = conn.cursor()
  cursor.execute('SELECT email, timestamp,accurancy FROM submissions WHERE competition="%s" ORDER BY accurancy DESC' % competition)
  data = cursor.fetchall()
  cursor.close()
  conn.close()
  
  # Prepare the response
  leaderboard_data = []
  for row in data:
    leaderboard_data.append({
      'email': row[0],
      'timestamp': row[1],
      'accurancy': row[2]
    })
  
  return jsonify(leaderboard_data)

@app.route('/vars')
def show_vars():
  # Get all HTTP headers
  headers = request.headers
  return str(headers)




def hello():
  return 'Hello, World!'

if __name__ == '__main__':
  app.run(host="0.0.0.0", port=8888)
