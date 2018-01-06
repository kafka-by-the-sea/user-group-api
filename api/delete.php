<?php
use GuzzleHttp\Client;

require '../vendor/autoload.php';

$client = new GuzzleHttp\Client(['base_uri' => 'http://url/api/v1/marketing/']);
$id  = $_POST["id"];

$response = $client->delete('usersegment'.'/'.$id);
echo json_encode([$id]);
