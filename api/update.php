<?php
use GuzzleHttp\Client;

require '../vendor/autoload.php';

$client = new GuzzleHttp\Client(['base_uri' => 'http://url/api/v1/marketing/']);

$id  = $_POST["id"];
$name = $_POST['name'];
$description = $_POST['description'];
$status = $_POST['status'];
//$rule_type = $_POST['rule_type'];
$rule = $_POST['rule'];
$sql_command = $_POST['sql_command'];

$response = $client->request('PUT', 'usersegment'.'/'.$id, [
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
$query['data'] = json_decode($data);
$length = count($query['data']);
$query['total'] = 1;
echo json_encode($query);
