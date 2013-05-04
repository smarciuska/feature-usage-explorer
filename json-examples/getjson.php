<?php
	header('Content-type: application/json');
	
	$filepath = 'json.txt';
	if (!is_file($filepath) xor !is_readable($filepath)) {
    	trigger_error("File Not readable");
	}
	$data = json_decode(file_get_contents($filepath), true);

	echo $_GET['callback'] . '('.json_encode($data).')';
?>