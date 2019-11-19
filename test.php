
  <?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "mydb";

// Create connection
$conn = mysqli_connect($servername, $username, $password, $dbname);
if (!$conn) {
  die("Connection failed: " . mysqli_connect_error());
}

$sql = "SELECT * from tblnews";
$result = mysqli_query($conn, $sql);


if (mysqli_num_rows($result) > 0) {
  // output data of each row
  while ($row = mysqli_fetch_assoc($result)) {
    $image=$row['news_image'];
      echo "<p class='title'>".$row["news_title"]."</p	>" . "<br>".  "<p class='date'>". "(". $row["news_timestamp"].")"."</p	>" .
              "<h4> Description:</h4> " . $row["news_desc"]."<br>"."<br>".
                '<img src="http://'.$image.'" width="360" height="150">'."<br>";
      echo "<hr>";
  }
} else {
  echo "0 results";
}

mysqli_close($conn);

?>