# SPCast.PlayerDefault
## Responsive web player with lyrics for SPCast

Thanks to the original project for the idea: [https://github.com/gsavio/player-shoutcast-html5](https://github.com/gsavio/player-shoutcast-html5).

We're using it for SPCast. The modified code should not be compatible with Shoutcast or Icecast servers anymore!
You can find more about SPCast [here](https://www.spcast.eu/).

## Requirements:
- PHP >= 8.x
- cURL

## HTML5 Player for SPCast streams with features like:
- Current song
- History of played songs
- Cover art of the current song via our own API. Cover Fallback goes to [iTunes API](https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/)
- Responsive design
- AI descriptions for songs
- MSE (Media Source Extensions) for streaming audio
- Multiple languages supported
- Tab, Tastatur support for screen readers
- You can't use it for Shoutcast or Icecast servers anymore!

## Keyboard Controls
- `M` - Mute/Unmute
- `P` and `space` - Play/Pause
- `Arrow Up` and `Arrow Down` - Increase/Decrease volume
- `0 to 9` - Volume percent
