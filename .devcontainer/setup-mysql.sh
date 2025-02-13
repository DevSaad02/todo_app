#!/bin/bash

# Install MySQL server
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update
sudo apt-get install -y mysql-server

# Start MySQL service
sudo service mysql start

# Secure MySQL setup and set root password
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'admin';"
sudo mysql -e "CREATE DATABASE todo_app;"

# Allow remote connections (optional)
sudo mysql -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'admin'; FLUSH PRIVILEGES;"

echo "MySQL installation complete!"
