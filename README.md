# 🐍 Zmeya

## 📋 Table of Contents
- [📖 About](#-about)
- [🚀 Getting Started](#-getting-started)
- [🔨 How to Build / How to Run](#-how-to-build--how-to-run)
- [🏗️ Project Structure](#️-project-structure)
- [🎯 Features](#-features)
- [🎮 Gameplay](#-gameplay)
- [📚 Dependencies](#-dependencies)
- [🐳 Docker Deployment](#-docker-deployment)
- [💡 Usage](#-usage)
- [🌐 Service Worker & PWA](#-service-worker--pwa)
- [📄 License](#-license)

## 📖 About
Zmeya is a modern snake game Progressive Web App featuring innovative gameplay mechanics with moving bugs, boss battles, and multilingual educational elements. Built with vanilla JavaScript and featuring advanced caching strategies for reliable offline play.

## 🚀 Getting Started

### Prerequisites
- Node.js (v20 or higher)
- npm package manager
- Modern web browser with Service Worker support

### 📦 Installation
```bash
git clone <repository-url>
cd zmeya
npm install
```

## 🔨 How to Build / How to Run

### Development Mode
```bash
# Start the development server
node server.js
```
The application will be available at `http://localhost:3000`

### Production Mode
```bash
# Install dependencies
npm install

# Set environment variables (optional)
export CACHE_VERSION=v3
export APP_NAME=zmeya

# Start the server
node server.js
```

## 🏗️ Project Structure
```
zmeya/
├── index.html           # Main game interface
├── main.js              # Core game logic and mechanics
├── styles.js            # UI styling and responsive design
├── server.js            # Express server with cache management
├── service-worker.js    # Advanced caching and offline support
├── manifest.json        # PWA manifest configuration
├── package.json         # Node.js dependencies
├── dockerfile           # Docker containerization
├── .gitignore          # Git ignore patterns
├── LICENSE             # MIT license
└── .github/workflows/  # CI/CD automation
    └── main.yml        # Docker build and push workflow
```

## 🎯 Features

### Core Gameplay
- **Moving Bugs**: Insects move randomly every 2.5 seconds for dynamic gameplay
- **Boss Battles**: 4 unique bosses on levels 2-5 requiring encirclement strategy
- **Diagonal Movement**: Virtual joystick supports 8-directional movement
- **Progressive Difficulty**: Speed increases with each bug eaten
- **Wrap-Around Edges**: Snake wraps around screen boundaries
- **Body Pass-Through**: Only tail collision causes game over

### Educational Elements
- **Multilingual Names**: Bug and boss names flash in Malagasy, French, Chinese, Japanese, and Russian
- **Cultural Learning**: Exposure to diverse languages through gameplay

### Technical Features
- **Progressive Web App**: Installable with offline functionality
- **Adaptive Caching**: Smart network-first strategy with fallbacks
- **Mobile-First Design**: Touch-optimized with virtual joystick
- **Responsive Layout**: Works on all screen sizes
- **Service Worker**: Advanced cache management for reliability

## 🎮 Gameplay

### Game Mechanics
- **Movement**: Use arrow keys, WASD, swipe gestures, or virtual joystick
- **Growth**: Snake grows by 2 segments per bug eaten
- **Speed**: Increases by 6ms reduction per bug (starts at 180ms, minimum 70ms)
- **Lives**: Only die by eating your own tail
- **Levels**: 5 levels total with increasing complexity

### Level Progression
1. **Level 1**: Warm-up - eat 10 bugs to advance
2. **Level 2**: Crocodile boss (🐊) - entangle by blocking four sides
3. **Level 3**: Tiger boss (🐅) - watch the stripes, entangle again
4. **Level 4**: Elephant boss (🐘) - big feet, bigger circle
5. **Level 5**: T-Rex boss (🦖) - final boss, lasso the dino

### Available Creatures
**Insects** (14 types): 🐌🦋🐛🐜🐝🪲🐞🦗🪳🕷️🦂🦟🪰🪱
**Bosses** (4 types): 🐊🐅🐘🦖
**Decorations**: 🍄🪷🏵️🌾🌻🌼🌷

## 📚 Dependencies

### Runtime Dependencies
- **Express**: `^4.18.2` - Web server framework for static file serving

### Core Technologies
- **Vanilla JavaScript**: Pure ES6+ without frameworks
- **Canvas API**: High-performance 2D rendering
- **Service Workers**: Advanced caching and offline support
- **Web App Manifest**: PWA functionality

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t zmeya:latest .
```

### Run Container
```bash
docker run -p 3000:3000 zmeya:latest
```

### Environment Variables
```bash
# Cache version for deployment updates
CACHE_VERSION=v2

# Application name for cache namespacing
APP_NAME=zmeya

# Service worker timeout configurations
SW_FIRST_TIME_TIMEOUT=20000
SW_RETURNING_USER_TIMEOUT=5000
SW_ENABLE_LOGS=true
```

## 💡 Usage

### Controls
- **Keyboard**: Arrow keys or WASD for movement, Space/Enter to start/pause
- **Touch**: Swipe gestures for cardinal directions
- **Virtual Joystick**: 8-directional control (mobile-optimized, positioned on right)
- **Buttons**: Start/Restart and Pause buttons available

### Game Strategy
1. **Bug Hunting**: Chase moving insects for points and growth
2. **Speed Management**: Balance risk vs. reward as speed increases
3. **Boss Battles**: Use snake body to block all four sides of bosses
4. **Survival**: Avoid eating your tail - edges and body are safe

### Performance Tips
- **Smooth Animation**: 60fps rendering with optimized canvas operations
- **Battery Efficient**: Pauses automatically when tab loses focus
- **Memory Management**: Automatic cleanup of expired game objects

## 🌐 Service Worker & PWA

### Caching Strategy
- **Network-First**: Tries network then falls back to cache
- **Adaptive Timeouts**: 20s for new users, 5s for returning users
- **Atomic Updates**: All-or-nothing cache updates for consistency
- **Version Management**: Automatic cleanup of old cache versions

### Cache Configuration
```javascript
// Configurable cache behavior
FIRST_TIME_TIMEOUT: 30000,     // Extended timeout for initial load
RETURNING_USER_TIMEOUT: 5000,  // Quick timeout with cache fallback
ENABLE_LOGS: true              // Debug logging toggle
```

### Offline Support
- **Complete Offline Play**: All assets cached for offline use
- **Update Notifications**: Alerts when new versions are available
- **Cache Lock Rescue**: Automatic recovery from cache corruption

### Installation
- **Add to Home Screen**: Full PWA installation support
- **Standalone Mode**: Runs like a native app
- **Manifest**: Complete PWA manifest with icons and theme colors

## 📄 License
MIT License - see LICENSE file for details.

---
**zmeya** • vanilla JS • mobile-first • PWA-ready
