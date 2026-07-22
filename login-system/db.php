<?php
$host     = "localhost";
$user     = "root";
$password = "rro0t1:";

$conn = new mysqli($host, $user, $password, "prog2")
    or die("Could not connect to the database server" . mysqli_connect_error());