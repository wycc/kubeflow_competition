FROM winterbelieve/jupyterlab-pytorch:V6.0

# Set the working directory
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY build/ /app
COPY start.sh /
RUN chmod +x /start.sh;mkdir /data
COPY src/server /server
COPY requirements.txt /app
# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir flask
RUN conda install -n pytorch flask
# Make port 8888 available to the world outside this container
EXPOSE 8888

CMD ["bash","-c", "/start.sh"]



