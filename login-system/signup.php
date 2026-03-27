<?php
// Include database configuration file
include_once "db.php"; // Adjust the file name and path as per your setup

// Check if the form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Retrieve form data
    $username = $_POST["username"];
    $email = $_POST["email"];
    $password = $_POST["password"];

    // Check if username or email already exists
    $stmt = $conn->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    $stmt->bind_param("ss", $username, $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // Username or email already exists, display error message or take appropriate action
        echo "Username or email already exists.";
    } else {
        // Insert new user into the database
        // Hash the password before storing it
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $username, $email, $hashed_password);
        $stmt->execute();

        // Redirect the user to the login page after successful signup
        header("Location: index.html");
        exit;
    }

    // Close statement and database connection
    $stmt->close();
    $conn->close();
}
?>
