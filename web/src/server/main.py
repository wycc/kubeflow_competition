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
import datetime

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
  accurancy REAL,
  phase TEXT DEFAULT "training"
)
''')
# create github table with url and name field
cursor.execute('''
CREATE TABLE IF NOT EXISTS github (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT,               
  path TEXT,               
  name TEXT,
  phase TEXT DEFAULT "training"
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

def get_competition_by_name(name):
  conn = sqlite3.connect('/data/database.db')
  cursor = conn.cursor()
  cursor.execute('SELECT path,url FROM github WHERE name="%s"' % name)
  path,url = cursor.fetchone()
  cursor.close()
  conn.close()
  return path,url

@app.route('/description', methods=['GET'])
def description():
  competition = request.args.get('competition')
  path,url = get_competition_by_name(competition)
  description_file = '/data/competitions/%s/description.txt' % path
  with open(description_file, 'r') as f:
    description = f.read().strip()
  return [description,url]

@app.route('/change_github_competition_phase', methods=['GET'])
def change_github_competition_phase():
  # change the phase of the competition
  # get the name from the request
  name = request.args.get('competition')
  phase = request.args.get('phase')
  # connect to the database
  conn = sqlite3.connect('/data/database.db')
  cursor = conn.cursor()
  cursor.execute('UPDATE github SET phase="%s" WHERE name="%s"' % (phase,name))
  conn.commit()
  cursor.close()
  conn.close()
  return {"status": "success"}

@app.route('/get_github_competition_phase', methods=['GET'])
def get_github_competition_phase():
  # get the phase of the competition
  # get the name from the request
  name = request.args.get('competition')
  # connect to the database
  conn = sqlite3.connect('/data/database.db')
  cursor = conn.cursor()
  cursor.execute('SELECT phase FROM github WHERE name="%s"' % name)
  phase = cursor.fetchone()
  app.logger.warning(phase)
  cursor.close()
  conn.close()
  return {"phase": phase[0]}

@app.route('/add_github_competition', methods=['GET'])
def add_github_compeition():
  # add github url to the github table of the database
  # get the url from the request
  # check if the url exists in the database
  conn = sqlite3.connect('/data/database.db')
  cursor = conn.cursor()
  url = request.args.get('url')
  cursor.execute('SELECT name FROM github WHERE url="%s"' % url)
  name = cursor.fetchone()
  cursor.close()
  conn.close()
  if name != None:
    return {"status": "Error: the url already exists"}
  try:
    url = request.args.get('url')
    path = url.split('/')[-1]
    # delete the old repository if it exists
    if path != '' and os.path.exists('/data/competitions/%s' % path):
      os.system('rm -rf /data/competitions/%s' % url.split('/')[-1])
    else:
      pass
    # pull the repository
    os.chdir('/data/competitions')
    r=os.system('git clone %s /data/competitions/%s' % (url, url.split('/')[-1]))
    if r != 0:
      return {"status": "Error: failed to clone the repository"}
    # check the structure of the repository
    # check if the description.txt exist
    description_file = os.path.join('/data/competitions/%s' % url.split('/')[-1], 'description.txt')
    if not os.path.isfile(description_file):
      return {"status": "Error: description.txt not found"}
    # check if the evaluate.py exist
    evaluate_file = os.path.join('/data/competitions/%s' % url.split('/')[-1], 'evaluate.py')
    if not os.path.isfile(evaluate_file):
      return {"status": "Error: evaluate.py not found"}
    # check if the name.txt exist
    name_file = os.path.join('/data/competitions/%s' % url.split('/')[-1], 'name.txt')
    if not os.path.isfile(name_file):
      return {"status": "Error: name.txt not found"}
    # connect to the database
    conn = sqlite3.connect('/data/database.db')
    cursor = conn.cursor()
    # read the name from the name.txt
    with open(name_file, 'r') as f:
      name = f.read().strip()
    # insert the url into the database
      
    cursor.execute('''
      INSERT INTO github (phase,url,name,path)
      VALUES (?,?, ?,?)
    ''', ('training',url,name,url.split('/')[-1]))
    conn.commit()
    cursor.close()
    conn.close()
    return {"status": "success", "name": name}
  except:
    print(traceback.format_exc())
    return {"status": "Error: failed to add the repository\n"+traceback.format_exc()}
  

  

  
  




@app.route('/github-competitions-update', methods=['GET'])
def github_competitions_update():
  # read the github table from the database
  # connect to the database
  conn = sqlite3.connect('/data/database.db')
  cursor = conn.cursor()
  # get name from request
  name = request.args.get('name')
  # read the url from the database by using the name
  cursor.execute('SELECT url FROM github WHERE name="%s"' % name)
  url = cursor.fetchone()
  # pull the repository
  os.system('git pull %s /data/competitions/%s' % (url, name))
  return {"status": "success"}

@app.route('/update_github_competition', methods=['GET'])
def update_github_competition():
  # read the github table from the database
  # connect to the database
  try:
    conn = sqlite3.connect('/data/database.db')
    cursor = conn.cursor()
    # get name from request
    name = request.args.get('competition')
    # read the url from the database by using the name
    cursor.execute('SELECT url,path FROM github WHERE name="%s"' % name)
    url,path = cursor.fetchone()
    # pull the repository
    if os.system('cd /data/competitions/%s;git pull' % (path)) != 0:
      return {"status": "Error: failed to pull the repository"}
  except:
    return {"status": "Error: failed to pull the repository\n"+traceback.format_exc()}
  
  return {"status": "success"}

@app.route('/delete_github_competition', methods=['GET'])
def delete_github_competition():
  # read the github table from the database
  # connect to the database
  try:
    conn = sqlite3.connect('/data/database.db')
    cursor = conn.cursor()
    # get name from request
    name = request.args.get('competition')
    
    # read the url from the database by using the name
    cursor.execute('SELECT name,path FROM github WHERE name="%s"' % name)
    items = cursor.fetchone()
    app.logger.warning(items)
    name,path = items
    # delete the repository
    if path != '' and os.path.exists('/data/competitions/%s' % path):
      os.system('rm -rf /data/competitions/%s' % path)
    else:
      return {"status": "Error: the repository does not exist"}
    # delete the record from the database
    cursor.execute('DELETE FROM github WHERE name="%s"' % name)
    conn.commit()
    cursor.close()
    conn.close()
    # delete leadedrboard
    conn = sqlite3.connect('/data/database.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM submissions WHERE competition="%s"' % name)
    conn.commit()
    cursor.close()
    conn.close()

    return {"status": "success"}
  except:
    return {"status": "Error: failed to delete the repository\n"+traceback.format_exc()}

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

@app.route('/delete_competition', methods=['POST'])
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
    # query the github table to get the path
    conn = sqlite3.connect('/data/database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT name,path,phase FROM github WHERE name="%s"' % competition)
    name,path,phase = cursor.fetchone()
    competition = name
    if path == None:
      return {"status": "Error: competition not found"}
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
      os.chdir('/data/competitions/%s' % path)
      app.logger.warning(competition)
      cmd = 'python3 /data/competitions/%s/evaluate.py %s %s 2>&1' % (path, model_name,phase)
      # execute cmd and get the result
      try:
        ret = os.popen(cmd).read()
        result = json.loads(ret)
      except:
        return {"status": "Error: the return value is not a valid json. "+ret}
      
    except Exception as e:
      # If an exception occurs, return an error
      return {"status": "Error loading PyTorch weights file: " + str(e)}
    
    #result = evaluate_model(model)
    app.logger.warning(result)
    # Insert the submission record into the leaderboard table
    # request.form['email']

    try:
      conn = sqlite3.connect('/data/database.db')
      cursor = conn.cursor()
      cursor.execute('SELECT phase FROM github WHERE name="%s"' % name)
      phase = cursor.fetchone()
      cursor.close()
      app.logger.warning(phase)
      cursor = conn.cursor()
      cursor.execute('''
        INSERT INTO submissions (competition,email, accurancy,phase)
        VALUES (?, ?,?,?)
      ''', (competition,email, result['accuracy'],phase[0]))
      conn.commit()
      cursor.close()
      conn.close()
    except Exception as e:
      print(e)
      return {"status": "Error inserting record into the leaderboard: " + str(e)}
    
    return {"status": f"result: {result['accuracy']}"}
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

  # read competitions from the github table
  conn = sqlite3.connect('/data/database.db')
  cursor = conn.cursor()
  cursor.execute('SELECT name,path FROM github')
  data = cursor.fetchall()
  cursor.close()
  conn.close()
  for row in data:
    # read description.txt from the directory under /data/competitions/name/description.txt
    try:
      f=open('/data/competitions/%s/description.txt' % row[1], "r")
      description = f.read()

      competition_list.append({
        'name': row[0],
        'description': description
      })
    except:
      continue

  # Iterate over the folders in the competitions directory
  #for folder_name in os.listdir(competitions_dir):
  #  folder_path = os.path.join(competitions_dir, folder_name)
  #  if os.path.isdir(folder_path):
  #    description_file = os.path.join(folder_path, 'description.txt')
  #    print(description_file)
  #    if os.path.isfile(description_file):
  #      with open(description_file, 'r') as f:
  #        description = f.read().strip()
  #        competition_list.append({
  #          'name': folder_name,
  #          'description': description
  #        })
  print(competition_list)
  return jsonify(competition_list)


@app.route('/leaderboard', methods=['GET'])
def leaderboard():
  
  # Fetch data from the leaderboard
  conn = sqlite3.connect('/data/database.db')
  cursor = conn.cursor()
  cursor.execute('SELECT email, timestamp,accurancy FROM submissions WHERE competition="%s" AND phase="training" ORDER BY accurancy DESC' % request.args.get('competition'))
  data = cursor.fetchall()
  cursor.close()
  conn.close()
  
  # Prepare the response
  leaderboard_data_training = []
  for row in data:
    leaderboard_data_training.append({
      'email': row[0],
      'timestamp': row[1]+' GMT+0000',
      'accurancy': row[2]
    })

  # Fetch data from the leaderboard
  conn = sqlite3.connect('/data/database.db')
  cursor = conn.cursor()
  cursor.execute('SELECT email, timestamp,accurancy FROM submissions WHERE competition="%s" AND phase="testing" ORDER BY accurancy DESC' % request.args.get('competition'))
  data = cursor.fetchall()
  cursor.close()
  conn.close()
  
  # Prepare the response
  leaderboard_data_testing = []
  for row in data:
    leaderboard_data_testing.append({
      'email': row[0],
      'timestamp': row[1]+' GMT+0000',
      'accurancy': row[2]
    })
  
  return jsonify({'training':leaderboard_data_training,'testing':leaderboard_data_testing})

@app.route('/vars')
def show_vars():
  # Get all HTTP headers
  headers = request.headers
  return str(headers)


@app.route('/file')
def file():
  # get the compititon name from the request
  name = request.args.get('competition')
  filename = request.args.get('path')
  # get the path from the database
  conn = sqlite3.connect('/data/database.db')
  cursor = conn.cursor()
  cursor.execute('SELECT path FROM github WHERE name="%s"' % name)
  path = cursor.fetchone()
  cursor.close()
  conn.close()
  # return the file
  try:
    f=open('/data/competitions/%s/%s.py' % (path[0],filename), "r")
  except:
    return 'Not Available'
  return f.read()

def hello():
  return 'Hello, World!'

if __name__ == '__main__':
  app.run(host="0.0.0.0", port=8888)
