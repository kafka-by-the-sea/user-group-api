<?php
use GuzzleHttp\Client;

require '../vendor/autoload.php';

$client = new GuzzleHttp\Client(['base_uri' => 'http://url/api/v1/marketing/']);

$name = $_POST['name'];
$description = $_POST['description'];
$status = $_POST['status'];
//$rule_type = $_POST['rule_type'];
$rule = $_POST['rule'];
$sql_command = $_POST['sql_command'];

$response = $client->request('POST', 'usersegment', [
    'json' => ['name' => $name,
               'description' => $description,
               'status' => $status,
               'rule_type' => 1,
               'rule' => $rule,
               'sql_command' => $sql_command
            ]
]);

$body = $response->getBody();
$data = $body->getContents();
$query = json_decode($data);
echo json_encode($query);
