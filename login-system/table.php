<?php
include 'db.php';

$table_name = "Abdalla";

$sql = "CREATE TABLE IF NOT EXISTS $table_name (
    id INT AUTO_INCREMENT PRIMARY KEY,
    LastName VARCHAR(255),
    FirstName VARCHAR(255)
)";

if ($connection->query($sql) === TRUE) {
    echo "Table $table_name created successfully or already exists.";
} else {
    echo "Error creating table: " . $connection->error;
}

$connection->close();
?>
