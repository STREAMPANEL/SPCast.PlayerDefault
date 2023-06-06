# SPCast.PlayerDefault
### Responsive web player with lyrics for SPCast streaming.

Thanks to the Original Project for the idea of this: [https://github.com/gsavio/player-shoutcast-html5](https://github.com/gsavio/player-shoutcast-html5).

We're using it for SPCast. The changed code should not be compatible with Shoutcast or Icecast Servers anymore!

## Required:
- PHP >= 8.x
- cURL

### HTML5 Player for SPCast streams with info like:
- Current song
- History of played songs
- Cover art of the current song ([iTunes API](https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/))
- Lyrics of the current song ([Vagalume API](https://api.vagalume.com.br/docs/))
- Responsive design

## Keyboard Controls:
- `M` - Mute/Unmute
- `P` and `space` - Play/Pause
- `Arrow Up` and `Arrow Down` - Increase/Decrease volume
- `0 to 9` - Volume percent
