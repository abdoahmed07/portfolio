<?php
session_start();

// Include database configuration file
include_once "db.php"; // Adjust the file name and path as per your setup

// Check if the form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Retrieve username/email and password from the form
    $username = $_POST["username"];
    $password = $_POST["password"];

    // Prepare and execute SQL query to retrieve user information
    $stmt = $conn->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    $stmt->bind_param("ss", $username, $username);
    $stmt->execute();
    $result = $stmt->get_result();

    // Check if the user exists
    if ($result->num_rows == 1) {
        $row = $result->fetch_assoc();
        $stored_password_hash = $row["password"]; // Assuming your password column is named "password"

        // Verify the password
        if (password_verify($password, $stored_password_hash)) {
            // Password is correct, set session variables and redirect to the tic-tac-toe game
            $_SESSION["username"] = $row["username"]; // Store the username in the session
            header("Location: ttt/index.html"); // Redirect to the game
            exit;
        } else {
            // Password is incorrect, set error message
            $error_message = "Password incorrect";
        }
    } else {
        // User not found, set error message
        $error_message = "Email is not registered";
    }

    // Close statement and database connection
    $stmt->close();
    $conn->close();
}
?>


