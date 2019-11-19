<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "MyDB";

// Create connection
$conn = mysqli_connect($servername, $username, $password, $dbname);
if (!$conn) {
  die("Connection failed: " . mysqli_connect_error());
}

$sql = "SELECT * from events";
$result = mysqli_query($conn, $sql);

if (mysqli_num_rows($result) > 0) {
  // output data of each row
  while ($row = mysqli_fetch_assoc($result)) {

  echo '<ul style="list-style-type:none" data-filter="true" data-inset="true" data-input="#rich-autocomplete-input">';

echo  "<li>";


    $image1=$row['evt_image'];
      echo "<p class='title'>".$row["evt_title"]."</p	>" . "<br>".  "<p class='date'>". "(". $row["evt_timestamp"].")"."</p	>" .
              "<h4> Description:</h4> " . $row["evt_desc"]."<br>"."<br>".
              '<img src="http://'.$image1.'" width="360" height="150">'."<br>";
echo  "</li>";
            echo	"</ul>";
      echo "<hr>";
  }
} else {
  echo "0 results";
}

mysqli_close($conn);

?>
