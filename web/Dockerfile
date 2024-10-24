FROM winterbelieve/jupyterlab-pytorch:V6.0

# Set the working directory
WORKDIR /app
# Install any needed packages specified in requirements.txt
COPY requirements.txt /app
RUN source /opt/conda/bin/activate pytorch; pip install --no-cache-dir flask kubernetes
RUN conda install -n pytorch flask -y

# Copy the current directory contents into the container at /app
COPY build/ /app
COPY src/server /server
COPY start.sh /
RUN chmod +x /start.sh;mkdir /data
# Make port 8888 available to the world outside this container
EXPOSE 8888

CMD ["bash","-c", "/start.sh"]



