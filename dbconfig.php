<?php 
// Database connection
$conn = new mysqli("localhost", "root", "admin", "todo_app");

// Check for connection errors
if ($conn->connect_error) {
    echo "Database connection failed";
    exit();
}
session_start();

?>