# Track Stats - Spicetify Extension

Advanced track statistics plugin for Spotify that displays comprehensive listening analytics with interactive features.

![Track Stats Preview](screenshot.png)

## 🎵 Features

### 📊 Statistics Display
- **Play count** and **total listening time** for each track
- **Real-time updates** as you listen to music
- **Persistent storage** - statistics saved between Spotify sessions
- **Daily statistics** tracking with detailed breakdown

### 🎯 UI Integration
- **Playbar stats** - Shows current track statistics in the now-playing bar
- **Track list stats** - Displays play count next to track titles in playlists, albums, and artist pages
- **Visual indicators** - Blue-themed design that integrates seamlessly with Spotify

### 🚀 Interactive Features
- **Hover tooltips** - Shows last played date when hovering over track stats
- **Track ranking modal** - Click playbar stats to see your top 10 most played tracks
- **Daily charts** - Click track list stats to view mini-charts of daily listening patterns
- **Draggable modals** - Move ranking and chart windows around the screen

### 🛠️ Technical Features
- **Auto-save** every 30 seconds and on browser close
- **Error handling** with fallback storage options
- **Dynamic DOM updates** using MutationObserver
- **Memory efficient** with optimized data structures

## 📥 Installation

### Method 1: Spicetify Marketplace (Recommended)
1. Install [Spicetify Marketplace](https://github.com/spicetify/spicetify-marketplace)
2. Search for "Track Stats" in the Extensions tab
3. Click Install

### Method 2: Manual Installation
1. Download the latest release from [Releases](https://github.com/knifeswx/track-stats/releases)
2. Copy `timer_by_knifeswx.js` to your Spicetify extensions folder:
   - Windows: `%APPDATA%\spicetify\Extensions\`
   - macOS: `~/spicetify_data/Extensions/`
   - Linux: `~/.config/spicetify/Extensions/`
3. Add the extension to your config:
   ```bash
   spicetify config extensions timer_by_knifeswx.js
   spicetify apply
   ```

## 🎮 Usage

### Viewing Statistics
- **Current track**: Statistics appear automatically in the playbar (right side)
- **Track lists**: Play count shows next to track titles in playlists and albums
- **Hover info**: Hover over track stats to see last played date

### Interactive Features
- **Rankings**: Click the playbar stats (📊 icon) to see your top tracks
- **Daily charts**: Click track list stats to view daily listening patterns
- **Clear data**: Use `clearTrackStats()` in browser console to reset all statistics

### Statistics Format
- **Play count**: `5x` (number of times played)
- **Time format**: `2h 30m` (hours and minutes)
- **Combined**: `📊 5x • 2h 30m` (in playbar)

## 🔧 Development

### Building from Source
```bash
git clone https://github.com/knifeswx/track-stats
cd track-stats
npm install
npm run build-local
```

### Project Structure
```
timer_by_knifeswx/
├── src/
│   └── app.tsx          # Main plugin code
├── dist/
│   └── timer_by_knifeswx.js  # Compiled extension
├── manifest.json        # Marketplace manifest
├── package.json
└── tsconfig.json
```

## 🗃️ Data Storage

Statistics are stored locally in your browser's localStorage with the key `spicetify-track-stats`. Data includes:
- Track URI, title, artist
- Play count and total listening time
- Last played timestamp
- Daily statistics breakdown

## 🧹 Clearing Data

To reset all statistics:
1. Open Spotify Developer Tools (Ctrl+Shift+I)
2. Go to Console tab
3. Type: `clearTrackStats()`
4. Press Enter

## 🐛 Troubleshooting

### Statistics not showing
- Ensure the extension is properly installed and enabled
- Check browser console for error messages
- Try refreshing Spotify (Ctrl+R)

### Data not persisting
- Check if localStorage is enabled in your browser
- Ensure Spotify has permission to store data
- Try clearing and rebuilding statistics

## 📝 Changelog

### v1.0.0
- Initial release with basic play count and time tracking
- Playbar and track list integration
- localStorage persistence

### v2.0.0
- Added daily statistics tracking
- Interactive modals with rankings and charts
- Draggable modal windows
- Hover tooltips with last played dates
- Improved UI design and animations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Spicetify](https://spicetify.app/) - For the amazing Spotify customization platform
- [Spicetify Creator](https://github.com/spicetify/spicetify-creator) - For the development tools