# Bombay Asteroids

**A high-octane arcade shooter with infinite procedural difficulty. Pilot your spaceship above Mumbai, dodge and destroy asteroids!**

🎮 **[Play Now](https://bombay-asteroids.streamlit.app/)** | 📂 **[GitHub Repo](https://github.com/somdeepkundu/bombay-asteroids)** | 🌐 **[Live Demo](https://somdeepkundu.github.io/bombay-asteroids/)**

---

## 🚀 Overview

Bombay Asteroids is a fully-playable arcade game built with **vanilla HTML5, Leaflet.js, and Web Audio API**. The game dynamically progresses across Mumbai's landmarks (IIT Bombay, Juhu Beach, Gateway of India) as you advance through levels. Every playthrough is different, with procedurally-scaled difficulty and real-time leaderboard tracking.

**Current Version:** v2.3.9 (Stable)

---

## ✨ Features

- **Procedural Difficulty Scaling** — Asteroids spawn count grows from 3 to 16+ per level; speed increases up to 280px/s
- **Object Pooling Optimization** — Efficient sprite recycling keeps performance smooth even at 10,000+ scores on low-end devices (Samsung A32, A36)
- **Dynamic Level Themes** — Progress through 10 Mumbai landmarks (IIT Bombay → Gateway of India) with flavor text hints
- **Leaderboard System** — Global real-time scores via Google Cloud Run backend; top 10 displayed on game over
- **Powerup System** — Health pickups, time boosters, and shield protection with audio/visual feedback
- **Mobile-First Controls** — Virtual joystick + fire button for tablets; keyboard + spacebar for desktop
- **Audio System** — Tabla background music + procedural SFX (laser blasts, explosions, pickups)
- **Progressive Web App (PWA)** — Service worker caching; plays offline
- **Responsive UI** — Works on phones, tablets, and desktop browsers

---

## 🎮 How to Play

1. **Enter your pilot name** and click PLAY
2. **Move:** Arrow keys or WASD (desktop) / Virtual joystick (mobile)
3. **Fire:** Spacebar (desktop) / Fire button (mobile)
4. **Survive the timer:** Each level has a countdown; reach the next level before time runs out
5. **Dodge asteroids** and **collect powerups:**
   - 🟢 **Health** — Restore 40 HP
   - ⏱️ **Time Boost** — Gain 12 extra seconds
   - 🛡️ **Shield** — Absorb next hit
6. **Reach higher levels** → More asteroids, faster speed, harder gameplay
7. **Game Over:** When health ≤ 0 or time runs out
8. **Leaderboard:** Your score is saved and ranked globally

---

## 📊 Difficulty Progression

| Level | Asteroids | Speed Range | Time Limit | Features |
|-------|-----------|------------|-----------|----------|
| 1-2 | 3-7 | 50-100 px/s | 52s | Learning phase |
| 3-4 | 9-11 | 100-180 px/s | 40s | Roll locks (drifting asteroids) |
| 5-6 | 13-15 | 180-240 px/s | 28-24s | Chaos ramps up |
| 7+ | 16+ | 240-280 px/s | 24s- | No mercy; pure reflex |

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, vanilla JavaScript (ES6+)
- **Game Rendering:** Canvas + Leaflet.js (map-based collision detection)
- **Physics:** Custom arcade physics with tile-based collision detection
- **Audio:** Web Audio API (procedural SFX) + HTML5 Audio (tabla music)
- **Backend:** Google Cloud Run (Python Flask API for leaderboard)
- **Database:** Firestore (NoSQL, real-time score tracking)
- **Deployment:** 
  - Streamlit (https://bombay-asteroids.streamlit.app/)
  - GitHub Pages (static version)
  - PWA (offline-capable)

---

## 📈 Performance

- **Target FPS:** 30 FPS on low-end mobile (A32), 60 FPS on desktop
- **Frame Time:** <33ms on A32 at level 5+ (10,000+ score, 16 asteroids, 30 shots)
- **Bundle Size:** ~50KB (script.js) + 600KB+ (Leaflet + Leaflet plugins)
- **Memory:** Efficient object pooling prevents memory leaks at high object counts
- **Load Time:** <2 seconds on 4G

---

## 🏆 Leaderboard (Top 3)

| Rank | Player | Score | Level | Date |
|------|--------|-------|-------|------|
| 🥇 1 | **Monalisa** | 8,460 | 20 | 20/04 12:57 IST |
| 🥈 2 | **Ayon Mandal** | 8,445 | 20 | 20/04 12:01 IST |
| 🥉 3 | **SAM** | 6,225 | 17 | 20/04 11:57 IST |

👉 [View Full Leaderboard](https://bombay-asteroids.streamlit.app/)

---

## 🎯 Key Decisions & Trade-Offs

| Decision | Reasoning | Trade-off |
|----------|-----------|-----------|
| **Leaflet.js over Babylon.js** | 2D-focused, smaller footprint, perfect for arcade games | No 3D support |
| **Object Pooling** | Critical for mobile performance; reuse sprites instead of allocating new ones | Complexity in object lifecycle management |
| **Procedural Audio** | Web Audio API for SFX saves bandwidth; no MP3 files needed | Requires audio programming knowledge |
| **Service Worker + PWA** | Offline play + instant load times | Extra caching logic to maintain |
| **Firestore for scores** | Real-time updates, automatic backups, scalable | Requires backend infrastructure |

---

## 📚 Learning & Credits

**Learned From:**  
📺 [Problem Solving with Abstraction](https://www.youtube.com/@Programming2.0/videos) by Programming 2.0 (YouTube)  
This project applies core CS concepts: object pooling, collision detection, state machines, and responsive UI.

**Audio Credit:**  
🥁 **Tabla Music:** Soumyadip Ghosh  
🌐 [Somdeep's Portfolio](http://www.somdeepkundu.in)

**Developed By:**  
👤 **Somdeep Kundu**  
@RuDRA Lab, C-TARA, IIT Bombay

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Python 3.8+
- Streamlit
- Git

### Installation
```bash
git clone https://github.com/somdeepkundu/bombay-asteroids.git
cd bombay-asteroids
pip install streamlit
streamlit run app.py
```

### File Structure
```
bombay-asteroids/
├── app.py                    # Streamlit entry point
├── script.js                 # Game logic + input handling
├── style.css                 # Styling + animations
├── index.html                # Game container + HUD
├── sw.js                      # Service worker (PWA)
├── manifest.json             # PWA manifest
├── assets/
│   ├── graphics/             # SVG sprites (ship, asteroids, projectiles)
│   ├── audio/                # Game table + SFX
│   └── images/               # Background maps
└── docs/                      # Documentation
```

---

## 🔧 Customization

### Adjust Difficulty
Edit `script.js`, function `getLevelConfig(lvl)`:
```javascript
const cfg = {
  count:     Math.min(3 + lvl * 2, 16),       // Asteroid count
  speedMin:  50  + lvl * 15,                   // Min speed
  speedMax:  Math.min(100 + lvl * 28, 280),   // Max speed
  timeLimit: Math.max(10, 52 - lvl * 4),      // Countdown (seconds)
};
```

### Change Audio
Replace `assets/audio/game_table1.mp3` with your own tabla track.

### Customize Landmarks
Edit `MUMBAI_WAYPOINTS` in `script.js` to change level themes.

---

## 🎓 What I Learned

✅ **Game Engine Concepts:** Sprite rendering, physics simulation, collision detection  
✅ **Performance Optimization:** Object pooling, FPS capping, mobile profiling  
✅ **Web APIs:** Canvas, Web Audio, Geolocation (for map centering), LocalStorage  
✅ **Responsive Design:** Mobile-first approach, touch controls, viewport scaling  
✅ **Backend Integration:** REST APIs, Firebase Firestore, Google Cloud Run  
✅ **PWA Standards:** Service workers, manifest.json, offline-first caching  

---

## 📱 Browser Support

- ✅ Chrome/Chromium 60+
- ✅ Firefox 55+
- ✅ Safari 12+ (iOS 12+)
- ✅ Edge 79+
- ✅ Samsung Internet 8+

---

## 📄 License

This project is open-source. Feel free to fork, modify, and deploy!

---

## 🔗 Links

- 🎮 **[Play Live](https://bombay-asteroids.streamlit.app/)**
- 📂 **[GitHub Repository](https://github.com/somdeepkundu/bombay-asteroids)**
- 🌐 **[Author Portfolio](https://somdeepkundu.github.io/)**
- 🎵 **[Tabla Music Credit](https://soumyadipghosh.com/)**

---

**Made with ❤️ in Bombay**  
*v2.3.9 — Stable & Optimized for Mobile*
