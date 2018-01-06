<?php
require 'db_config.php';
require '../vendor/autoload.php';
$sql = $_POST['sql'];

$result = $mysqli->query($sql);
while ($row = $result->fetch_assoc()) {
    echo $row['total'] . " 筆" . "<br>" . $sql;
}
