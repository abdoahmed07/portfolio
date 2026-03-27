<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Database</title>
</head>
<body>
<?php
$host = "localhost";
$user = "root";
$password = "rro0t1:";
$connection = new mysqli( $host, $user, $password,"prog2") or die( 'Could not connect to the database server' . mysqli_connect_error() );
 
$table_name = "Abdalla"; // Välj ett namn på din tabell!
 
$sql = "CREATE TABLE $table_name ( id INT, LastName VARCHAR(255), FirstName VARCHAR(255) );";
// Byt ut mot de kolonner du vill ha i tabellen (ID är bra att ha med)!
 
echo "<br>Detta är din SQL: $sql<br><br>";
 
if ( $connection->query( $sql ) === true ) // Här skapas tabellen!
  echo "<br>New DB created successfully!<br><br>";
else
  echo "Error: " . $sql . "<br>" . $connection->error;
 
// Nedan visas ett exempel på hur man använder tabellen!
$sql = "INSERT INTO $table_name( LastName, FirstName ) VALUES( 'Förnamnet', 'Efternamnet' );";
 
if ( $connection->query( $sql ) === true )
  echo "New record created successfully!<br><br>";
else
  echo "Error: " . $sql . "<br>" . $connectionn->error;
 
$connection->close();
?>
</body>
</html>