<?php
/*
The MIT License (MIT)

Github: https://github.com/STREAMPANEL/SPCast.PlayerDefault

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

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

// Construct the current song text file URL
$url = "https://$replacedURL/currentSong.txt";

// Check if the user ID is present in the GET request
if (empty($_GET['userid'])) {
	// Exit the script if no user ID is present
	exit;
}

// Store the user ID in a variable
$userID = $_GET['userid'];

// Create a log file for the user
$logFilename = "log/$userID.log";

// Function to fetch data from a text file
function fetchTextFile($url)
{

	// Initialize cURL session
	$curl = curl_init($url);

	// Set options for the cURL request
	curl_setopt_array($curl, [
		// Return the transfer 
		CURLOPT_RETURNTRANSFER => 1,
		// Do not verify SSL certificate
		CURLOPT_SSL_VERIFYPEER => false,
		// Set user agent
		CURLOPT_USERAGENT      => 'SPMetaDataCrawler/1.0',
	]);

	// Execute the cURL request
	$text_data = curl_exec($curl);

	// Check for cURL errors
	if (curl_errno($curl)) {
		echo 'cURL Error: ' . curl_error($curl);
		// Handle the error as per your requirement
		return null;
	}

	// Close cURL session
	curl_close($curl);

	return $text_data;
}

// Fetch data from the current song text file
$current_song_data = fetchTextFile($url);

// Check if data was retrieved successfully
if (!empty($current_song_data)) {
	// Clean up the song data (assuming it's a single line format)
	$current_song_data = trim($current_song_data);

	// Define incorrect and correct glyphs
	$incorrect_glyphs = ["Ã¶", "Ã¤", "Ã¼", "ÃŸ", "Ã–", "Ã„", "Ãœ"];
	$correct_glyphs   = ["ö", "ä", "ü", "ß", "Ö", "Ä", "Ü"];

	// Replace incorrect glyphs with correct ones
	$current_song_data = str_replace($incorrect_glyphs, $correct_glyphs, $current_song_data);

	// Split the string into artist and song
	$currently_playing = explode(' - ', $current_song_data, 2);

	// Set the current song and artist in the array
	$array['currentSong']   = $currently_playing[1];
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

	// Get the contents of the log file and store it in the $track_history variable 
	$track_history = file($logFilename, FILE_IGNORE_NEW_LINES);

	// Remove first element from history
	array_shift($track_history);

	// Check if historic is true
	if ($historic) {
		// Set counter to 0
		$i = 0;

		// Loop through track history
		foreach ($track_history as $line) {
			// If counter is greater than 6, skip the iteration
			if ($i > 6) {
				continue;
			}

			// Explode line into artist and song
			$track       = explode(' - ', $line, 2);
			$last_artist = explode(';', $track[0])[0];
			$last_song   = str_replace(["\n", "\r"], '', $track[1]);

			// Add artist and song to array
			$array['songHistory'][] = ['artist' => $last_artist, 'song' => $last_song];

			// Increment counter
			++$i;
		}
	}

	// Initialize cURL for fetching ChatGPT Songinfo asynchronously
	$info_url = 'https://playlist.spcast.eu/g/generate_info.php';
	$params   = http_build_query(array(
		'artist' => $currently_playing[0],
		'title'  => $currently_playing[1],
	));
	$info_url = $info_url . '?' . $params;

	// Initialize cURL session
	$curl_info = curl_init();
	curl_setopt($curl_info, CURLOPT_URL, $info_url);
	curl_setopt($curl_info, CURLOPT_RETURNTRANSFER, true);

	// Set a short timeout for the async request (adjust as needed)
	curl_setopt($curl_info, CURLOPT_TIMEOUT_MS, 100);

	// Execute cURL request asynchronously
	curl_exec($curl_info);

	// Close cURL session
	curl_close($curl_info);

	// Set the content type to JSON
	header('Content-type: application/json', true);

	// Encode the array as a JSON string and output it
	echo json_encode($array);

	// Terminate script execution
	die();
} else {
	// Handle case where current song data retrieval failed
	echo json_encode(['error' => 'Failed to retrieve current song data.']);
	die();
}
