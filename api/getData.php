<?php
use GuzzleHttp\Client;

require '../vendor/autoload.php';

$client = new GuzzleHttp\Client(['base_uri' => 'http://url/api/v1/marketing/']);
$response = $client->get('usersegment');

$body = $response->getBody();
$data = $body->getContents();
$query['data'] = json_decode($data);
$length = count($query['data']);
$query['total'] = 1;
echo json_encode($query);
