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
  window.location.href = "/stream";
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
  var page = new Page();
  page.setVolume();

  // Call getStreamingData() function
  getStreamingData();

  // Interval to get streaming data in milliseconds
  setInterval(getStreamingData, 10000);

  // Get cover art element
  var coverArt = document.getElementsByClassName("cover-album")[0];

  // Set height of cover art equal to its width
  coverArt.style.height = coverArt.offsetWidth + "px";
};

// Create audio element
var audio = document.createElement("audio");
document.body.appendChild(audio); // Append audio element to the body

var mediaSource;
var sourceBuffer;
var fetchController;
var reconnectInterval;
var isPlaying = false;
var inactivityTimeout; // Added for inactivity detection
var useMSE = false; // Added to track whether MSE is used

// DOM control
function Page() {
  // Function to change the title page of the website
  this.changeTitlePage = function (title = RADIO_NAME) {
    document.title = title;
  };

  // Function to refresh the current song and artist playing
  this.refreshCurrentSong = function (song, artist) {
    var currentSong = document.getElementById("currentSong");
    var currentArtist = document.getElementById("currentArtist");

    // Check if the song is different from the one currently playing
    if (song !== currentSong.innerHTML) {
      // Animate transition
      currentSong.className = "animated flipInY text-uppercase";
      currentSong.innerHTML = song;

      currentArtist.className = "animated flipInY text-capitalize";
      currentArtist.innerHTML = artist;

      // Remove animation classes after 2 seconds
      setTimeout(() => {
        currentSong.className = "text-uppercase";
        currentArtist.className = "text-capitalize";
      }, 2000);
    }
  };

  // Function to refresh the historic song list
  this.refreshHistoric = function (info, n) {
    // Selectors for song and artist name
    var $historicDiv = document.querySelectorAll("#historicSong article");
    var $songName = document.querySelectorAll(
      "#historicSong article .music-info .song"
    );
    var $artistName = document.querySelectorAll(
      "#historicSong article .music-info .artist"
    );

    // Default cover art
    var urlCoverArt = DEFAULT_COVER_ART;

    // Get cover art for song history
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.status === 200) {
          var data = JSON.parse(this.responseText);
          var artworkUrl100 = data.resultCount
            ? data.results[0].artworkUrl100
            : null;

          if (artworkUrl100) {
            document.querySelectorAll("#historicSong article .cover-historic")[
              n
            ].style.backgroundImage = "url(" + artworkUrl100 + ")";
          } else {
            // Fallback to SP Cover API
            fetch(
              `https://cover.streampanel.net/cover-api/sp/spcast.php?title=${info.artist} - ${info.song}&size=medium&urlonly=yes`
            )
              .then((response) => {
                if (response.ok) {
                  return response.text();
                } else {
                  throw new Error("No cover found");
                }
              })
              .then((url) => {
                document.querySelectorAll(
                  "#historicSong article .cover-historic"
                )[n].style.backgroundImage = "url(" + url + ")";
              })
              .catch(() => {
                document.querySelectorAll(
                  "#historicSong article .cover-historic"
                )[n].style.backgroundImage = "url(" + urlCoverArt + ")";
              });
          }
        } else {
          // Fallback to SP Cover API
          fetch(
            `https://cover.streampanel.net/cover-api/sp/spcast.php?title=${info.artist} - ${info.song}&size=medium&urlonly=yes`
          )
            .then((response) => {
              if (response.ok) {
                return response.text();
              } else {
                throw new Error("No cover found");
              }
            })
            .then((url) => {
              document.querySelectorAll(
                "#historicSong article .cover-historic"
              )[n].style.backgroundImage = "url(" + url + ")";
            })
            .catch(() => {
              document.querySelectorAll(
                "#historicSong article .cover-historic"
              )[n].style.backgroundImage = "url(" + urlCoverArt + ")";
            });
        }
      }

      // Formatting characters to UTF-8
      var music = info.song.replace(/&apos;/g, "'").replace(/&amp;/g, "&");
      var artist = info.artist.replace(/&apos;/g, "'").replace(/&amp;/g, "&");

      // Set song and artist name
      $songName[n].innerHTML = music;
      $artistName[n].innerHTML = artist;

      // Add class for animation
      $historicDiv[n].classList.add("animated");
      $historicDiv[n].classList.add("slideInRight");
    };
    // Request to iTunes API
    xhttp.open(
      "GET",
      "https://itunes.apple.com/search?term=" +
        info.artist +
        " " +
        info.song +
        "&media=music&limit=1",
      true
    );
    xhttp.send();

    // Remove animation classes after 2 seconds
    setTimeout(function () {
      for (var j = 0; j < SP_MAX_HISTORY; j++) {
        $historicDiv[j].classList.remove("animated");
        $historicDiv[j].classList.remove("slideInRight");
      }
    }, 2000);
  };

  // Function to refresh the cover art
  this.refreshCover = function (song = "", artist) {
    // Default cover art
    var urlCoverArt = DEFAULT_COVER_ART;

    // Request to iTunes API
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      var coverArt = document.getElementById("currentCoverArt");
      var coverBackground = document.getElementById("bgCover");

      // Get cover art URL on iTunes API
      if (this.readyState === 4) {
        if (this.status === 200) {
          var data = JSON.parse(this.responseText);
          var artworkUrl100 = data.resultCount
            ? data.results[0].artworkUrl100
            : null;

          if (artworkUrl100) {
            urlCoverArt = artworkUrl100.replace("100x100bb", "512x512bb");
            var urlCoverArt96 = urlCoverArt.replace("512x512bb", "96x96bb");
            var urlCoverArt128 = urlCoverArt.replace("512x512bb", "128x128bb");
            var urlCoverArt192 = urlCoverArt.replace("512x512bb", "192x192bb");
            var urlCoverArt256 = urlCoverArt.replace("512x512bb", "256x256bb");
            var urlCoverArt384 = urlCoverArt.replace("512x512bb", "384x384bb");

            coverArt.style.backgroundImage = `url(${urlCoverArt})`;
            coverArt.className = "animated bounceInLeft";
            coverBackground.style.backgroundImage = `url(${urlCoverArt})`;

            // Remove animation class after 2 seconds
            setTimeout(function () {
              coverArt.className = "";
            }, 2000);

            // Set media session metadata
            if ("mediaSession" in navigator) {
              navigator.mediaSession.metadata = new MediaMetadata({
                title: song,
                artist: artist,
                artwork: [
                  { src: urlCoverArt96, sizes: "96x96", type: "image/png" },
                  { src: urlCoverArt128, sizes: "128x128", type: "image/png" },
                  { src: urlCoverArt192, sizes: "192x192", type: "image/png" },
                  { src: urlCoverArt256, sizes: "256x256", type: "image/png" },
                  { src: urlCoverArt384, sizes: "384x384", type: "image/png" },
                  { src: urlCoverArt, sizes: "512x512", type: "image/png" },
                ],
              });
            }
          } else {
            // Fallback to SP Cover API
            fetch(
              `https://cover.streampanel.net/cover-api/sp/spcast.php?title=${artist} - ${song}&size=medium&urlonly=yes`
            )
              .then((response) => {
                if (response.ok) {
                  return response.text();
                } else {
                  throw new Error("No cover found");
                }
              })
              .then((url) => {
                coverArt.style.backgroundImage = `url(${url})`;
                coverBackground.style.backgroundImage = `url(${url})`;
              })
              .catch(() => {
                coverArt.style.backgroundImage = `url(${urlCoverArt})`;
                coverBackground.style.backgroundImage = `url(${urlCoverArt})`;
              });
          }
        } else {
          // Fallback to SP Cover API
          fetch(
            `https://cover.streampanel.net/cover-api/sp/spcast.php?title=${artist} - ${song}&size=medium&urlonly=yes`
          )
            .then((response) => {
              if (response.ok) {
                return response.text();
              } else {
                throw new Error("No cover found");
              }
            })
            .then((url) => {
              coverArt.style.backgroundImage = `url(${url})`;
              coverBackground.style.backgroundImage = `url(${url})`;
            })
            .catch(() => {
              coverArt.style.backgroundImage = `url(${urlCoverArt})`;
              coverBackground.style.backgroundImage = `url(${urlCoverArt})`;
            });
        }
      }
    };
    // Request to iTunes API
    xhttp.open(
      "GET",
      `https://itunes.apple.com/search?term=${artist} ${song}&media=music&limit=1`,
      true
    );
    xhttp.send();
  };

  // Function to change the volume indicator
  this.changeVolumeIndicator = function (volume) {
    // Set the volume indicator
    document.getElementById("volIndicator").innerHTML = volume;

    // Store the volume in local storage
    if (typeof Storage !== "undefined") {
      localStorage.setItem("volume", volume);
    }
  };

  // Function to set the volume
  this.setVolume = function () {
    // Check if local storage is available
    if (typeof Storage !== "undefined") {
      // Set the volume from local storage or default value
      var volumeLocalStorage = !localStorage.getItem("volume")
        ? 80
        : localStorage.getItem("volume");
      document.getElementById("volume").value = volumeLocalStorage;
      document.getElementById("volIndicator").innerHTML = volumeLocalStorage;
    }
  };
}

// Function to get streaming data from the server
function getStreamingData() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    // Check if the request is successful
    if (this.readyState === 4 && this.status === 200) {
      // Log debug message if response is empty
      if (this.response.length === 0) {
        console.log("%cdebug", "font-size: 22px");
      }

      // Parse response text into JSON object
      var data = JSON.parse(this.responseText);

      // Create a new page object
      var page = new Page();

      // Get current song element and format characters to UTF-8
      let currentSongElement = document.getElementById("currentSong").innerHTML;
      let currentSongEl = currentSongElement.replace(/&amp;|&apos;/g, (match) =>
        match === "&amp;" ? "&" : "'"
      );
      let song = data.currentSong.replace(/&amp;|&apos;/g, (match) =>
        match === "&amp;" ? "&" : "'"
      );
      let currentSong = song.replace("  ", " ");
      let artist = data.currentArtist.replace(/&amp;|&apos;/g, (match) =>
        match === "&amp;" ? "&" : "'"
      );
      let currentArtist = artist.replace("  ", " ");

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
  xhttp.open(
    "GET",
    `https://scripts.streampanel.net/spcast/player/default/api.php?url=${URL_HOSTNAME}&userid=${SP_USERID}&historic=${HISTORIC}&t=${d.getTime()}`,
    true
  );
  xhttp.send();
}

// Player control
function Player() {
  // Play audio and set volume
  this.play = function () {
    if (isPlaying) return; // Prevent multiple initializations

    isPlaying = true;

    // Check if MSE is supported with audio/mpeg
    var mimeCodec = "audio/mpeg";
    if (window.MediaSource && MediaSource.isTypeSupported(mimeCodec)) {
      useMSE = true;
      console.log(
        "MSE is supported. Using MediaSource with codec: ",
        mimeCodec
      );
      initializeMediaSource();
    } else {
      useMSE = false;
      console.log(
        "MSE not supported with codec ",
        mimeCodec,
        ". Falling back to direct stream."
      );
      audio.src = URL_STREAMING;
      audio.load();
      audio.play().catch((error) => {
        console.error("Error playing audio directly: ", error);
      });
    }

    var defaultVolume = document.getElementById("volume").value;

    // Check if local storage is available
    if (typeof Storage !== "undefined") {
      // If there is a saved volume, use it
      if (localStorage.getItem("volume") !== null) {
        audio.volume = intToDecimal(localStorage.getItem("volume"));
      } else {
        // Otherwise, use the default volume
        audio.volume = intToDecimal(defaultVolume);
      }
    } else {
      // If local storage is not available, use the default volume
      audio.volume = intToDecimal(defaultVolume);
    }
    document.getElementById("volIndicator").innerHTML = defaultVolume;
  };

  // Pause audio
  this.pause = function () {
    if (!isPlaying) return;

    isPlaying = false;
    if (useMSE) {
      console.log("Stopping playback and closing MediaSource...");
      stopMediaSource();
    } else {
      console.log("Pausing direct audio playback.");
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      var botao = document.getElementById("playerButton");
      botao.className = "fas fa-play";
    }
  };
}

// Initialize MediaSource
function initializeMediaSource() {
  mediaSource = new MediaSource();
  audio.src = URL.createObjectURL(mediaSource);

  mediaSource.addEventListener("sourceopen", sourceOpen);

  audio
    .play()
    .then(() => {
      console.log("Audio started playing with MSE.");
    })
    .catch((error) => {
      console.error("Error playing audio with MSE: ", error);
      attemptReconnect();
    });
}

// Stop MediaSource
function stopMediaSource() {
  if (fetchController) {
    fetchController.abort();
    fetchController = null;
  }

  if (sourceBuffer && mediaSource && mediaSource.readyState === "open") {
    try {
      sourceBuffer.abort();
      mediaSource.removeSourceBuffer(sourceBuffer);
      console.log("SourceBuffer removed.");
    } catch (e) {
      console.error("Error removing SourceBuffer: ", e);
    }
  }

  if (mediaSource) {
    if (mediaSource.readyState === "open") {
      try {
        mediaSource.endOfStream();
        console.log("MediaSource ended.");
      } catch (e) {
        console.error("Error ending MediaSource: ", e);
      }
    }
    mediaSource = null;
  }

  audio.pause();
  audio.removeAttribute("src");
  audio.load();

  // Update the play/pause button
  var botao = document.getElementById("playerButton");
  botao.className = "fas fa-play";

  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }

  if (inactivityTimeout) {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = null;
  }

  isPlaying = false;
}

// Handle MediaSource events
function sourceOpen() {
  var mimeCodec = "audio/mpeg";
  console.log("MediaSource opened. MIME type: ", mimeCodec);

  if (MediaSource.isTypeSupported(mimeCodec)) {
    sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
    console.log("SourceBuffer created.");

    // Listen for updateend event to log buffer updates
    sourceBuffer.addEventListener("updateend", function () {
      // Log buffered ranges every 10 chunks
      if (chunkCount % 10 === 0) {
        console.log(
          "SourceBuffer update ended. Buffered ranges: ",
          sourceBuffer.buffered
        );
      }
    });

    fetchStreamData(URL_STREAMING);
  } else {
    console.error("Unsupported MIME type or codec: ", mimeCodec);
    // Fallback to direct stream
    mediaSource.endOfStream();
    audio.src = URL_STREAMING;
    audio.load();
    audio.play().catch((error) => {
      console.error("Error playing audio directly: ", error);
    });
  }
}

var chunkCount = 0;

// Function to fetch streaming data and append to SourceBuffer
function fetchStreamData(url) {
  console.log("Fetching stream data from: ", url);
  fetchController = new AbortController();
  var signal = fetchController.signal;

  fetch(url, { signal })
    .then(function (response) {
      var reader = response.body.getReader();

      function read() {
        reader
          .read()
          .then(function (result) {
            if (result.done) {
              console.log("Stream complete");
              attemptReconnect();
              return;
            }

            // Reset the inactivity timeout
            if (inactivityTimeout) {
              clearTimeout(inactivityTimeout);
            }
            inactivityTimeout = setTimeout(function () {
              console.log(
                "Inactivity timeout reached. Attempting to reconnect..."
              );
              fetchController.abort();
              attemptReconnect();
            }, 10000); // 10 seconds of inactivity

            if (sourceBuffer.updating || mediaSource.readyState !== "open") {
              sourceBuffer.addEventListener("updateend", function update() {
                sourceBuffer.removeEventListener("updateend", update);
                appendBuffer(result.value);
                read();
              });
            } else {
              appendBuffer(result.value);
              read();
            }
          })
          .catch(function (error) {
            if (error.name === "AbortError") {
              console.log("Stream fetching aborted.");
            } else {
              console.error("Error reading stream: ", error);
              attemptReconnect();
            }
          });
      }
      read();
    })
    .catch(function (error) {
      if (error.name === "AbortError") {
        console.log("Fetch aborted.");
      } else {
        console.error("Error fetching stream: ", error);
        attemptReconnect();
      }
    });
}

// Function to append buffer to SourceBuffer
function appendBuffer(chunk) {
  try {
    sourceBuffer.appendBuffer(chunk);
    chunkCount++;
    if (chunkCount % 10 === 0) {
      console.log(
        "Appended chunk to SourceBuffer. Chunk size: ",
        chunk.byteLength
      );
    }
  } catch (e) {
    console.error("Error appending buffer: ", e);
    if (e.name === "QuotaExceededError") {
      // Remove old buffer to make space
      var buffered = sourceBuffer.buffered;
      if (buffered.length > 0) {
        var removeEnd = buffered.start(0) + 5; // Remove first 5 seconds
        sourceBuffer.remove(buffered.start(0), removeEnd);
        console.log(
          "Removed buffer from ",
          buffered.start(0),
          " to ",
          removeEnd
        );
      }
    } else {
      attemptReconnect();
    }
  }
}

// Automatic reconnect
function attemptReconnect() {
  console.log("Attempting to reconnect...");
  if (reconnectInterval) return; // Prevent multiple intervals

  // Keep trying to reconnect every 5 seconds
  reconnectInterval = setInterval(function () {
    if (!isPlaying) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
      return;
    }
    console.log("Reconnecting...");
    if (useMSE) {
      stopMediaSource();
      initializeMediaSource();
    } else {
      audio.load();
      audio.play().catch((error) => {
        console.error("Error playing audio directly during reconnect: ", error);
      });
    }
  }, 5000);
}

// On play, change the button to pause
audio.onplay = function () {
  var botao = document.getElementById("playerButton");

  // Change the button class to pause
  if (botao.className === "fas fa-play") {
    botao.className = "fas fa-pause";
  }
  console.log("Audio is playing.");
};

// On pause, change the button to play
audio.onpause = function () {
  var botao = document.getElementById("playerButton");

  // Change the button class to play
  if (botao.className === "fas fa-pause") {
    botao.className = "fas fa-play";
  }
  console.log("Audio is paused.");
};

// Unmute when volume changed
audio.onvolumechange = function () {
  // If the volume is greater than 0, unmute
  if (audio.volume > 0) {
    audio.muted = false;
  }
  console.log("Volume changed to: ", audio.volume);
};

// Reload page on error
audio.onerror = function () {
  console.error("Audio encountered an error.");
  attemptReconnect();
};

// Change volume when slider is moved
document.getElementById("volume").oninput = function () {
  audio.volume = intToDecimal(this.value);

  // Create new Page object
  var page = new Page();
  page.changeVolumeIndicator(this.value);
  console.log("Volume slider changed to: ", this.value);
};

// Toggle play/pause
function togglePlay() {
  var player = new Player();

  // If playing, pause
  if (isPlaying) {
    player.pause();
  } else {
    // Play the audio
    console.log("Loading audio...");
    player.play();
    console.log("Audio load triggered.");
  }
}

// Increase volume
function volumeUp() {
  var vol = audio.volume;
  // If audio is playing and volume is between 0 and 1
  if (audio && audio.volume >= 0 && audio.volume < 1) {
    // Increase volume by 0.01
    audio.volume = Math.min((parseFloat(vol) + 0.01).toFixed(2), 1);
    console.log("Volume increased to: ", audio.volume);
  }
}

// Decrease volume
function volumeDown() {
  var vol = audio.volume;
  // If audio is playing and volume is between 0.01 and 1
  if (audio && audio.volume > 0) {
    // Decrease volume by 0.01
    audio.volume = Math.max((parseFloat(vol) - 0.01).toFixed(2), 0);
    console.log("Volume decreased to: ", audio.volume);
  }
}

// Mute/unmute
function mute() {
  // If not muted, mute
  if (!audio.muted) {
    document.getElementById("volIndicator").innerHTML = 0;
    document.getElementById("volume").value = 0;
    audio.volume = 0;
    audio.muted = true;
    console.log("Audio muted.");
  } else {
    // Otherwise, get the saved volume and unmute
    var localVolume = localStorage.getItem("volume") || 80;
    document.getElementById("volIndicator").innerHTML = localVolume;
    document.getElementById("volume").value = localVolume;
    audio.volume = intToDecimal(localVolume);
    audio.muted = false;
    console.log("Audio unmuted. Volume set to: ", audio.volume);
  }
}

// Player control by keys
document.addEventListener("keydown", function (k) {
  var k = k || window.event;
  var key = k.keyCode || k.which;

  var slideVolume = document.getElementById("volume");

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
      var volumeLevel = key >= 96 ? key - 96 : key - 48;
      audio.volume = volumeLevel / 10;
      // Update the slider value
      slideVolume.value = volumeLevel * 10;
      // Update the volume indicator
      page.changeVolumeIndicator(volumeLevel * 10);
      console.log("Volume set to: ", audio.volume);
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
