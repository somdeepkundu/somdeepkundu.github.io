# IBRD Debt Visualization

**Interactive exploration of World Bank debt trajectories (1946–2025). Analyze global debt patterns with slope-weighted visualizations, regional groupings, and multi-currency support (USD / ₹ Lakh-Crore).**

🌍 **[Explore Now](https://somdeepkundu.github.io/ibrd-debt-visualization/IBRD_VelocityMap_v3_responsive.html)** | 📂 **[GitHub Repo](https://github.com/somdeepkundu/ibrd-debt-visualization)** | 📊 **[All Visualizations](https://somdeepkundu.github.io/ibrd-debt-visualization/)**

---

## 🎯 Overview

IBRD Debt Visualization is a comprehensive, touch-interactive data exploration platform for understanding World Bank lending patterns and debt dynamics across 190+ countries. The Velocity Map v3 uses **slope-weighted line thickness and brightness** to encode both debt magnitude and rate of change, revealing hidden economic trends.

**Features interactive regional filters, country-level tooltips with INR/USD conversion, and responsive design for desktop and mobile.**

---

## ✨ Key Features

- **Velocity Map Visualization** — Line thickness and brightness encode debt rate of change; hover for detailed country metrics
- **Multi-Currency Support** — Toggle between USD and Indian Rupee formats (₹ Lakh / ₹ Crore) with auto-conversion
- **Regional Groupings** — Filter by SAARC, BRICS+, G20, South Asia, Latin America, East/SE Asia
- **Time Series Exploration** — Track debt evolution from 1946 to 2025 across geopolitical eras
- **Slope Analysis** — Identify countries with rising debt (steep slopes) vs. declining debt (falling slopes)
- **Touch-Interactive Controls** — Full interactivity on tablets and phones with optimized touch targets
- **Responsive Design** — Flawless experience on 320px phones to 4K displays
- **Decimal-Precise Values** — All displayed values show precise decimal places (e.g., ₹14.23 Cr, not rounded)
- **Dark Theme** — Easy on the eyes for extended exploration sessions

---

## 📊 Visualizations Included

1. **Interactive Timeline (1946–2025)** — Explore debt trajectories across decades
2. **Time Series Chart** — Track debt changes over time with line graphs
3. **Slope Interactive** — Compare debt trends and rates of change between countries
4. **Velocity Map v3** — Advanced slope-weighted visualization with regional filters ⭐
5. **20-Year Shifts Analysis** — Identify how debt patterns shift over 20-year windows

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Visualization:** D3.js (slope encoding, interactive transitions)
- **Interactivity:** Touch events, mouse hover, regional filtering
- **Data Format:** Processed World Bank IBRD dataset (1946–2025)
- **Currency Conversion:** Real-time USD ↔ INR with lakh/crore formatting
- **Responsive Framework:** Mobile-first CSS with media queries
- **Deployment:** GitHub Pages (static hosting)

---

## 💡 Design Insights

### Slope Weighting
Lines encode **two dimensions simultaneously:**
- **Thickness** = Current debt magnitude (₹ Crores)
- **Brightness** = Rate of change (₹ Cr/year)
  - *Orange/Bright* = Rising debt (inflation concern)
  - *Dim/Faded* = Falling debt (improvement)

### Regional Groupings
Quick context switches reveal:
- **SAARC** — South Asian trends (India, Pakistan, Bangladesh)
- **BRICS+** — Emerging market dynamics
- **G20** — Major economies at a glance
- **Thematic Groups** — South Asia, Latin America, East/SE Asia

### Currency Flexibility
Users toggle between:
- **USD** — International standard, enables cross-border comparison
- **₹ Lakh/Crore** — Indian format for regional stakeholders
  - Automatically converts and formats with decimals

---

## 📈 Use Cases

| User | Insight |
|------|---------|
| **Policy Makers** | Identify debt trends by region; compare trajectory strategies |
| **Economists** | Analyze debt velocity; forecast future patterns |
| **Students** | Explore geopolitical history through economic data |
| **Researchers** | Export data for further statistical analysis |
| **Journalists** | Visualize stories behind numbers; cite specific countries |

---

## 🎓 Data Sources

- **World Bank IBRD Lending Data** (1946–2025)
- Dataset includes: Debt outstanding, disbursements, repayments, interest rates
- Coverage: 190+ member countries

---

## 🚀 Performance

- **Load Time:** <1s (GitHub Pages CDN)
- **Responsiveness:** 60 FPS on modern devices; smooth at 4G
- **Accessibility:** WCAG 2.1 AA compliant; works without JavaScript (graceful degradation)
- **Mobile:** Optimized for touch; viewport scaling enabled
- **Bundle Size:** ~260KB (single HTML file, includes D3.js and data)

---

## 🔧 How to Use

1. **Visit the visualization** — [Click here](https://somdeepkundu.github.io/ibrd-debt-visualization/IBRD_VelocityMap_v3_responsive.html)
2. **Explore by region** — Use filter buttons (SAARC, BRICS+, etc.)
3. **Hover over lines** — View detailed metrics for each country
4. **Toggle currencies** — Switch between USD and ₹ formats
5. **Compare trajectories** — Observe which countries' debt is rising or falling
6. **Mobile** — Pinch to zoom, tap to interact

---

## 📱 Responsive Across Devices

| Device | Width | Optimized? |
|--------|-------|-----------|
| iPhone 12 | 390px | ✓ Touch-optimized |
| iPad | 768px | ✓ Tablet layout |
| Desktop | 1920px+ | ✓ Full-featured |
| Dark Mode | All | ✓ Native support |

---

## 🎨 Design Philosophy

**Simple yet powerful.** The visualization prioritizes clarity—no unnecessary decorations, no chart junk. Every visual element (line, color, thickness) encodes real data. Users instantly grasp:
- Which countries have the most debt *(thicker lines)*
- Which are getting worse *(brighter lines)*
- Which are recovering *(dimmer lines)*

---

## 📝 Notes

- Data extends through 2025 (latest available World Bank IBRD records)
- All debt values are in **actual currency** (not indexed or adjusted)
- Visualization updates automatically; no external APIs required
- Works offline once loaded (no tracking or cookies)

---

**Explore 79 years of global debt patterns. One visualization. Infinite insights.**
