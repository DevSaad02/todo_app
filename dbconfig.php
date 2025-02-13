<?php 
// Database connection
$conn = new mysqli("127.0.0.1", "root", "admin", "todo_app");

// Check for connection errors
if ($conn->connect_error) {
    echo "Database connection failed";
    exit();
}
session_start();

?>