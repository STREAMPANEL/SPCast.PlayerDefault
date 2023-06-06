/*
The MIT License (MIT)

Github: https://github.com/gsavio

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

// Redirect Safari
var uagent = navigator.userAgent.toLowerCase();
if (/safari/.test(uagent) && !/chrome/.test(uagent)) {
    window.location.href = "/stream"
}

// Declare constants for settings
const RADIO_NAME = settings.radio_name;
const URL_STREAMING = settings.url_streaming;
const URL_HOSTNAME = settings.url_hostname;
const HISTORIC = settings.historic;
const SP_USERID = settings.sp_userid;
const DEFAULT_COVER_ART = settings.default_cover_art;
const SP_MAX_HISTORY = 6;

window.onload = function () {
    // Create new page object
    var page = new Page;
    page.setVolume();

    // Create new player object
    //var player = new Player();
    //player.play();

    // Call getStreamingData() function
    getStreamingData();

    // Interval to get streaming data in miliseconds
    setInterval(getStreamingData, 10000);

    // Get cover art element
    var coverArt = document.getElementsByClassName('cover-album')[0];

    // Set height of cover art equal to its width
    coverArt.style.height = coverArt.offsetWidth + 'px';

}

// Create new audio object with URL_STREAMING
var audio = new Audio(URL_STREAMING);

// DOM control
function Page() {
    // Function to change the title page of the website 
    this.changeTitlePage = function (title = RADIO_NAME) {
        document.title = title;
    };

    // Function to refresh the current song and artist playing
    this.refreshCurrentSong = function (song, artist) {
        var currentSong = document.getElementById('currentSong');
        var currentArtist = document.getElementById('currentArtist');

        // Check if the song is different from the one currently playing
        if (song !== currentSong.innerHTML) {
            // Animate transition
            currentSong.className = 'animated flipInY text-uppercase';
            currentSong.innerHTML = song;

            currentArtist.className = 'animated flipInY text-capitalize';
            currentArtist.innerHTML = artist;

            // Remove animation classes after 2 seconds
            setTimeout(() => {
                currentSong.className = 'text-uppercase';
                currentArtist.className = 'text-capitalize';
            }, 2000);
        }
    }

    // Function to refresh the historic song list
    this.refreshHistoric = function (info, n) {
        // Selectors for song and artist name
        var $historicDiv = document.querySelectorAll('#historicSong article');
        var $songName = document.querySelectorAll('#historicSong article .music-info .song');
        var $artistName = document.querySelectorAll('#historicSong article .music-info .artist');

        // Default cover art
        var urlCoverArt = DEFAULT_COVER_ART;

        // Get cover art for song history
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                var data = JSON.parse(this.responseText);
                var artworkUrl100 = (data.resultCount) ? data.results[0].artworkUrl100 : urlCoverArt;

                // Set background image of the cover art
                document.querySelectorAll('#historicSong article .cover-historic')[n].style.backgroundImage = 'url(' + artworkUrl100 + ')';
            }
            // Formating characters to UTF-8
            var music = info.song.replace(/&apos;/g, '\'').replace(/&amp;/g, '&');
            var artist = info.artist.replace(/&apos;/g, '\'').replace(/&amp;/g, '&');

            // Set song and artist name
            $songName[n].innerHTML = music;
            $artistName[n].innerHTML = artist;

            // Add class for animation
            $historicDiv[n].classList.add('animated');
            $historicDiv[n].classList.add('slideInRight');
        }
        // Request to iTunes API
        xhttp.open('GET', 'https://itunes.apple.com/search?term=' + info.artist + ' ' + info.song + '&media=music&limit=1', true);
        xhttp.send();

        // Remove animation classes after 2 seconds
        setTimeout(function () {
            for (var j = 0; j < SP_MAX_HISTORY; j++) {
                $historicDiv[j].classList.remove('animated');
                $historicDiv[j].classList.remove('slideInRight');
            }
        }, 2000);
    }

    // Function to refresh the cover art
    this.refreshCover = function (song = '', artist) {
        // Default cover art
        var urlCoverArt = DEFAULT_COVER_ART;

        // Request to iTunes API
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            var coverArt = document.getElementById('currentCoverArt');
            var coverBackground = document.getElementById('bgCover');

            // Get cover art URL on iTunes API
            if (this.readyState === 4 && this.status === 200) {
                var data = JSON.parse(this.responseText);
                var artworkUrl100 = (data.resultCount) ? data.results[0].artworkUrl100 : urlCoverArt;

                // Se retornar algum dado, alterar a resolução da imagem ou definir a padrão
                urlCoverArt = (artworkUrl100 != urlCoverArt) ? artworkUrl100.replace('100x100bb', '512x512bb') : urlCoverArt;
                var urlCoverArt96 = (artworkUrl100 != urlCoverArt) ? urlCoverArt.replace('512x512bb', '96x96bb') : urlCoverArt;
                var urlCoverArt128 = (artworkUrl100 != urlCoverArt) ? urlCoverArt.replace('512x512bb', '128x128bb') : urlCoverArt;
                var urlCoverArt192 = (artworkUrl100 != urlCoverArt) ? urlCoverArt.replace('512x512bb', '192x192bb') : urlCoverArt;
                var urlCoverArt256 = (artworkUrl100 != urlCoverArt) ? urlCoverArt.replace('512x512bb', '256x256bb') : urlCoverArt;
                var urlCoverArt384 = (artworkUrl100 != urlCoverArt) ? urlCoverArt.replace('512x512bb', '384x384bb') : urlCoverArt;

                // Set background image of the cover art
                coverArt.style.backgroundImage = `url(${urlCoverArt})`;
                coverArt.className = 'animated bounceInLeft';

                // Set background image of the cover background
                coverBackground.style.backgroundImage = `url(${urlCoverArt})`;

                // Remove animation class after 2 seconds
                setTimeout(function () {
                    coverArt.className = '';
                }, 2000);

                // Set media session metadata
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: song,
                        artist: artist,
                        artwork: [{
                            src: urlCoverArt96,
                            sizes: '96x96',
                            type: 'image/png'
                        },
                        {
                            src: urlCoverArt128,
                            sizes: '128x128',
                            type: 'image/png'
                        },
                        {
                            src: urlCoverArt192,
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: urlCoverArt256,
                            sizes: '256x256',
                            type: 'image/png'
                        },
                        {
                            src: urlCoverArt384,
                            sizes: '384x384',
                            type: 'image/png'
                        },
                        {
                            src: urlCoverArt,
                            sizes: '512x512',
                            type: 'image/png'
                        }
                        ]
                    });
                }
            }
        }
        // Request to iTunes API
        xhttp.open('GET', `https://itunes.apple.com/search?term=${artist} ${song}&media=music&limit=1`, true);
        xhttp.send();
    }

    // Function to change the volume indicator
    this.changeVolumeIndicator = function (volume) {
        // Set the volume indicator
        document.getElementById('volIndicator').innerHTML = volume;

        // Store the volume in local storage
        if (typeof (Storage) !== 'undefined') {
            localStorage.setItem('volume', volume);
        }
    }

    // Function to set the volume
    this.setVolume = function () {
        // Check if local storage is available
        if (typeof (Storage) !== 'undefined') {
            // Set the volume from local storage or default value
            var volumeLocalStorage = (!localStorage.getItem('volume')) ? 80 : localStorage.getItem('volume');
            document.getElementById('volume').value = volumeLocalStorage;
            document.getElementById('volIndicator').innerHTML = volumeLocalStorage;
        }
    }
}

// Function to get streaming data from the server 
function getStreamingData() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {

        // Check if the request is successful
        if (this.readyState === 4 && this.status === 200) {

            // Log debug message if response is empty
            if (this.response.length === 0) {
                console.log('%cdebug', 'font-size: 22px')
            }

            // Parse response text into JSON object
            var data = JSON.parse(this.responseText);

            // Create a new page object
            var page = new Page();

            // Get current song element and format characters to UTF-8
            let currentSongElement = document.getElementById('currentSong').innerHTML;
            let currentSongEl = currentSongElement.replace(/&amp;|&apos;/g, match => match === '&amp;' ? '&' : '\'');
            let song = data.currentSong.replace(/&amp;|&apos;/g, match => match === '&amp;' ? '&' : '\'');
            let currentSong = song.replace('  ', ' ');
            let artist = data.currentArtist.replace(/&amp;|&apos;/g, match => match === '&amp;' ? '&' : '\'');
            let currentArtist = artist.replace('  ', ' ');

            // Change the document title
            document.title = `${currentSong} - ${currentArtist} | ${RADIO_NAME}`;

            // Refresh cover, current song and historic if current song is different
            if (currentSongEl.trim() !== currentSong.trim()) {
                page.refreshCover(currentSong, currentArtist);
                page.refreshCurrentSong(currentSong, currentArtist);

                for (var i = 0; i < SP_MAX_HISTORY; i++) {
                    page.refreshHistoric(data.songHistory[i], i);
                }
            }
        }
    };

    // Create a new date object
    var d = new Date();

    // Send GET request with timestamp to prevent cache
    xhttp.open('GET', `https://scripts.streampanel.net/spcast/player/default/api.php?url=${URL_HOSTNAME}&userid=${SP_USERID}&historic=${HISTORIC}&t=${d.getTime()}`, true);
    xhttp.send();
}

// Player control
function Player() {
    // Play audio and set volume
    this.play = async function () {
        await audio.play();

        var defaultVolume = document.getElementById('volume').value;

        // Check if local storage is available
        if (typeof (Storage) !== 'undefined') {
            // If there is a saved volume, use it
            if (localStorage.getItem('volume') !== null) {
                audio.volume = intToDecimal(localStorage.getItem('volume'));
            } else {
                // Otherwise, use the default volume
                audio.volume = intToDecimal(defaultVolume);
            }
        } else {
            // If local storage is not available, use the default volume
            audio.volume = intToDecimal(defaultVolume);
        }
        document.getElementById('volIndicator').innerHTML = defaultVolume;
    };

    // Pause audio
    this.pause = function () {
        audio.pause();
    };
}

// On play, change the button to pause
audio.onplay = function () {
    var botao = document.getElementById('playerButton');

    // Change the button class to pause
    if (botao.className === 'fas fa-play') {
        botao.className = 'fas fa-pause';
    }
}

// On pause, change the button to play
audio.onpause = function () {
    var botao = document.getElementById('playerButton');

    // Change the button class to play
    if (botao.className === 'fas fa-pause') {
        botao.className = 'fas fa-play';
    }
}

// Unmute when volume changed
audio.onvolumechange = function () {
    // If the volume is greater than 0, unmute
    if (audio.volume > 0) {
        audio.muted = false;
    }
}

// Reload page on error
audio.onerror = function () {
    // Ask for confirmation before reloading
    var confirmacao = confirm('Error on communicate to server. \nClick OK to try again or contact us.');

    // If confirmed, reload the page
    if (confirmacao) {
        window.location.reload();
    }
}

// Change volume when slider is moved
document.getElementById('volume').oninput = function () {
    audio.volume = intToDecimal(this.value);

    // Create new Page object
    var page = new Page();
    page.changeVolumeIndicator(this.value);
}

// Toggle play/pause
function togglePlay() {
    // If playing, pause
    if (!audio.paused) {
        audio.pause();
    } else {
        // Otherwise, load and play
        audio.load();
        audio.play();
    }
}

// Increase volume
function volumeUp() {
    var vol = audio.volume;
    // If audio is playing and volume is between 0 and 1
    if (audio && audio.volume >= 0 && audio.volume < 1) {
        // Increase volume by 0.01
        audio.volume = (vol + .01).toFixed(2);
    }
}

// Decrease volume
function volumeDown() {
    var vol = audio.volume;
    // If audio is playing and volume is between 0.01 and 1
    if (audio && audio.volume >= 0.01 && audio.volume <= 1) {
        // Decrease volume by 0.01
        audio.volume = (vol - .01).toFixed(2);
    }
}

// Mute/unmute
function mute() {
    // If not muted, mute
    if (!audio.muted) {
        document.getElementById('volIndicator').innerHTML = 0;
        document.getElementById('volume').value = 0;
        audio.volume = 0;
        audio.muted = true;
    } else {
        // Otherwise, get the saved volume and unmute
        var localVolume = localStorage.getItem('volume');
        document.getElementById('volIndicator').innerHTML = localVolume;
        document.getElementById('volume').value = localVolume;
        audio.volume = intToDecimal(localVolume);
        audio.muted = false;
    }
}

// Player control by keys
document.addEventListener('keydown', function (k) {
    var k = k || window.event;
    var key = k.keyCode || k.which;

    var slideVolume = document.getElementById('volume');

    // Create new Page object
    var page = new Page();

    // Switch statement for different key presses
    switch (key) {
        // Arrow up
        case 38:
            // Increase volume
            volumeUp();
            // Update the slider value
            slideVolume.value = decimalToInt(audio.volume);
            // Update the volume indicator
            page.changeVolumeIndicator(decimalToInt(audio.volume));
            break;
        // Arrow down
        case 40:
            // Decrease volume
            volumeDown();
            // Update the slider value
            slideVolume.value = decimalToInt(audio.volume);
            // Update the volume indicator
            page.changeVolumeIndicator(decimalToInt(audio.volume));
            break;
        // Spacebar
        case 32:
            // Toggle play/pause
            togglePlay();
            break;
        // P
        case 80:
            // Toggle play/pause
            togglePlay();
            break;
        // M
        case 77:
            // Mute/unmute
            mute();
            break;
        // 0-9
        case 48:
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
        case 96:
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
            // Set volume based on key pressed
            audio.volume = (key - 48) / 10;
            // Update the slider value
            slideVolume.value = (key - 48) * 10;
            // Update the volume indicator
            page.changeVolumeIndicator((key - 48) * 10);
            break;
    }
});

// Convert integer to decimal
function intToDecimal(vol) {
    return vol / 100;
}

// Convert decimal to integer
function decimalToInt(vol) {
    return vol * 100;
}
