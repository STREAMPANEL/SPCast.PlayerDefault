<?php

// Configuration
if (file_exists('sp_config.php')) {
	require 'sp_config.php';
} else {
	require 'config.php';
}

// Disable error_log: NOTICES
ini_set('error_reporting', ~E_NOTICE);

// true or false to show history of played songs
$historic = filter_input(INPUT_GET, 'historic', FILTER_VALIDATE_BOOLEAN);

// Get the URL from the GET request
if (empty($_GET['url'])) {
	// Exit the program if the URL is empty
	exit;
}

// Store the URL in a variable
$getURL = $_GET['url'];

// Replace '/stream' with an empty string in the URL
$replacedURL = str_replace('/stream', '', $getURL);

// Construct the API endpoint URL using the replaced URL
$url = "https://$replacedURL/$endpointID";

// Check if the user ID is present in the GET request
if (empty($_GET['userid'])) {
	// Exit the script if no user ID is present
	exit;
}

// Store the user ID in a variable
$userID = $_GET['userid'];

// Create a log file for the user
$logFilename = "log/$userID.log";

// Initialize curl request with the given URL 
$curl = curl_init($url);

// Set options for the curl request
curl_setopt_array($curl, [
	// Return the transfer 
	CURLOPT_RETURNTRANSFER => 1,
	// Do not verify SSL certificate
	CURLOPT_SSL_VERIFYPEER => false,
	// Set user agent
	CURLOPT_USERAGENT => 'SPMetaDataCrawler/1.0',
	// Set username and password
	CURLOPT_USERPWD => "$endpointUsername:$endpointPassword"
]);

// Execute the curl request
$data = curl_exec($curl);

// Close the curl request
curl_close($curl);

// Check if the data is empty
if (!empty($data)) {
	// Decode the JSON data into an array
	$spcast_stats = json_decode($data, true);

	// Check if the metadata for the stream live exists
	if (isset($spcast_stats['mounts']['/stream_live']['metadata'])) {
		// Set the source to the stream_live metadata
		$spcast_stats_source = $spcast_stats['mounts']['/stream_live']['metadata'];
	} else {
		// Set the source to the autodj metadata
		$spcast_stats_source = $spcast_stats['mounts']['/autodj']['metadata'];
	}

	// Get the currently playing song
	$currently_playing = $spcast_stats_source['now_playing'];

	// Define incorrect and correct glyphs
	$incorrect_glyphs = ["Ã¶", "Ã¤", "Ã¼", "ÃŸ", "Ã–", "Ã„", "Ãœ"];
	$correct_glyphs = ["ö", "ä", "ü", "ß", "Ö", "Ä", "Ü"];

	// Replace incorrect glyphs with correct ones
	$currently_playing = str_replace($incorrect_glyphs, $correct_glyphs, $currently_playing);

	// Split the string into artist and song
	$currently_playing = explode(' - ', $currently_playing, 2);

	// Set the current song and artist in the array
	$array['currentSong'] = $currently_playing[1];
	$array['currentArtist'] = explode(';', $currently_playing[0])[0];

	// Check if the log file exists
	if (!file_exists($logFilename)) {
		// Create the log file
		file_put_contents($logFilename, '');
	}

	// Get the track history from the log file
	$track_history = file($logFilename, FILE_IGNORE_NEW_LINES);

	// Get the last 20 tracks from the track history
	$track_list = array_slice($track_history, 0, 20);

	// Check if the current song is already in the track list
	if (!in_array($currently_playing[0] . ' - ' . $currently_playing[1], $track_history, true)) {
		// Add the current song to the beginning of the track list
		array_unshift($track_list, $currently_playing[0] . ' - ' . $currently_playing[1]);

		// Assume that the original string is in UTF-8 encoding
		$track_list_utf8 = $track_list;

		// Check if the string is valid UTF-8, and convert it if not
		if (!mb_check_encoding(implode("\n", $track_list_utf8), 'UTF-8')) {
			$track_list_utf8 = array_map('utf8_encode', $track_list_utf8);
		}

		// Write the UTF-8 string to the file
		file_put_contents($logFilename, implode("\n", $track_list_utf8));
	}
} else {
	// Set an error message in the array
	$array = ['error' => 'Failed to fetch data'];
}

// Get the contents of the log file and store it in the $track_history variable 
$track_history = file($logFilename, FILE_IGNORE_NEW_LINES);

// remove first element from history
array_shift($track_history);

// check if historic is true
if ($historic) {
	// set counter to 0
	$i = 0;

	// loop through track history
	foreach ($track_history as $line) {
		// if counter is greater than 6, skip the iteration
		if ($i > 6) {
			continue;
		}

		// explode line into artist and song
		$track = explode(' - ', $line, 2);
		$last_artist = explode(';', $track[0])[0];
		$last_song = str_replace(["\n", "\r"], '', $track[1]);

		// add artist and song to array
		$array['songHistory'][] = ['artist' => $last_artist, 'song' => $last_song];

		// increment counter
		++$i;
	}
}

// Set the content type to JSON
header('Content-type: application/json', true);

// Encode the array as a JSON string and output it
echo json_encode($array);