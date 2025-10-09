# Interactive Soap Foam Physics Simulator

An educational, web-based 2D simulation demonstrating the physics of soap bubbles and foam formation with interactive controls and beautiful visualizations.

![Version](https://img.shields.io/badge/version-vf7cffdb-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🌟 Features

### Physics Simulation
- **Surface Tension Modeling** - Bubbles maintain spherical shapes using Young-Laplace principles
- **Coalescence Dynamics** - Realistic bubble merging with volume conservation
- **Plateau Borders** - Triple junctions automatically form 120° angles (honeycomb structure)
- **Collision Detection** - Spatial partitioning (Quadtree) for efficient O(n log n) performance
- **Deformable Bubbles** - Bubbles squish and morph when pressed together
- **Gravity & Friction** - Customizable environmental forces

### Interactive Controls
- **Real-time Sliders** - Adjust 14+ physics parameters on the fly
- **Preset Configurations** - Honeycomb, Pebbles, Rubber Balls, Soap
- **Visual Styles** - Flat, Matte, Glossy rendering modes
- **Color Palettes** - 6 beautiful color schemes (Blues, Spectrum, Ocean, Rainbow, Mono, Fire)
- **Obstacle Drawing** - Draw rotating pipes that bubbles navigate around
- **Audio Feedback** - Size-adaptive coalescence sounds

### Visual Features
- **Multiple Rendering Styles** - From flat solid colors to glossy gradients
- **Color Palettes** - Vibrant, themed color schemes
- **Performance Optimized** - Runs at 60 FPS with 500+ bubbles
- **Mobile Responsive** - Touch controls for tablets and phones
- **Auto-hide UI** - Panels slide away for unobstructed viewing

## 🎮 Controls

### Basic Interactions
- **Left-click + drag** - Drag and throw bubbles
- **Mouse hover (edges)** - Reveal control panels
- **Pin button** (📌) - Toggle auto-hide panels

### Bottom-Right Buttons
- **SHUFFLE** ⚡ - Apply compression force to pack bubbles
- **RESTART** 🔄 - Restart simulation with current settings
- **DEFAULT** ⚙️ - Reset all controls to default values
- **OBSTACLES** 🚧 - Toggle obstacle drawing mode
- **SOUND** 🔊 - Toggle audio effects

### Obstacle Mode Controls
When OBSTACLES mode is enabled:
- **Click + drag** - Draw continuous rotating pipes
- **Ctrl + click pivot** - Move rotation pivot point along pipe
- **Ctrl + right-click pivot** - Adjust rotation angle (distance = amplitude)
- **Right-click** or **Shift+click** - Remove obstacle/pipe

### Physics Parameters

#### Bubble Behavior
- **Separation** - Distance between bubble centers
- **Separation Force** - How strongly bubbles push apart
- **Collision Strength** - Bounciness of collisions
- **Wall Bounce** - Energy retention on wall impacts

#### Shape & Tension
- **Morphing Strength** - How much bubbles deform when pressed
- **Morphing Threshold** - Distance at which deformation starts
- **Surface Tension** - Force maintaining round shapes
- **Plateau Force** - Strength of 120° angle formation

#### Environment
- **Gravity** - Downward pull on bubbles
- **Friction** - Energy loss from air resistance
- **Coalescence Rate** - How quickly bubbles merge

#### Appearance
- **Bubble Count** - Total number of bubbles (10-1000)
- **Average Size** - Base bubble radius
- **Size Variation** - Diversity in bubble sizes

### Spawn Color Options
Click the faucet button (💧) to choose:
- **Custom Color** - Pick any color from color wheel
- **Different Palette** - Select from available palettes
- **Current Palette** - Use active display palette

## 🎨 Presets

### Honeycomb 🍯
Large uniform bubbles forming perfect hexagonal patterns with Plateau borders. Uses Fire palette display with Blues spawning.

### Pebbles 🪨
Medium-sized varied bubbles with gentle collisions. Mono (grayscale) palette with Ocean spawns.

### Rubber Balls 🎾
Dense pack of varied-size bubbles with high gravity and bounciness. Rainbow display with Ocean spawns. Deep bass audio.

### Soap 🫧
Realistic soap bubble behavior with high surface tension and varied sizes. Blues display with Fire spawns.

## 🔧 Technical Details

### Architecture
- **Modular Design** - Separated concerns (Physics, Renderer, Controls, Interactions, Audio, Obstacles)
- **ES6 Modules** - Modern JavaScript with import/export
- **Performance Optimized** - Quadtree spatial partitioning, gradient rendering optimization
- **No Dependencies** - Pure vanilla JavaScript, HTML5 Canvas, Web Audio API

### Performance
- **Target**: 60 FPS with 500+ bubbles
- **Optimization**: Spatial partitioning reduces collision detection from O(n²) to O(n log n)
- **Monitoring**: Real-time FPS counter and bubble count display

### Browser Support
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📁 Project Structure

```
bubble-project/
├── index.html              # Main HTML file
├── src/
│   ├── main.js            # Simulation orchestrator
│   └── modules/
│       ├── bubble.js      # Bubble class and color palettes
│       ├── physics.js     # Physics engine (collisions, merging, forces)
│       ├── renderer.js    # Canvas rendering and UI generation
│       ├── controls.js    # Interactive controls and parameter management
│       ├── interactions.js # Mouse/touch event handling
│       ├── tooltip.js     # Custom tooltip system
│       ├── obstacles.js   # Rotating obstacle pipes
│       ├── audio.js       # Sound effects and audio management
│       └── spatial.js     # Quadtree spatial partitioning
├── archieve/              # Documentation and specs
├── external model/        # 3D assets (future use)
└── README.md             # This file
```

## 🚀 Getting Started

### Running Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/ozlphrt/bubble-project.git
   cd bubble-project
   ```

2. **Start a local server**
   ```bash
   # Using Python 3
   python -m http.server 3001
   
   # Or using Node.js
   npx http-server -p 3001
   ```

3. **Open in browser**
   ```
   http://localhost:3001
   ```

### GitHub Pages
Live demo: `https://ozlphrt.github.io/bubble-project/`

## 🎓 Educational Use

This simulator demonstrates:
- **Plateau's Laws** - Soap films meet at 120° angles
- **Young-Laplace Equation** - Pressure difference across curved interfaces
- **Surface Tension** - Minimization of surface energy
- **Coalescence** - Bubble merging with conservation laws
- **Emergent Behavior** - Complex patterns from simple rules

## 🎯 Future Enhancements

- [ ] 3D visualization with Three.js/WebGL
- [ ] Additional audio layers (collisions, ambient)
- [ ] Save/load custom configurations
- [ ] Video recording of simulations
- [ ] Advanced physics (Marangoni effects, drainage)
- [ ] VR/AR support

## 📝 Version History

- **vf7cffdb** (Current) - Project cleanup, comprehensive README, clickable version link
- **v680e8e2** - Coalescence audio, palette cleanup
- **v65f9b1a** - Preset updates, visual styles
- **Earlier** - Core physics, UI, performance optimizations

## 👥 Contributing

This is an educational project. Suggestions and improvements welcome!

## 📄 License

MIT License - See project documentation for details.

## 🙏 Acknowledgments

Built with inspiration from real soap bubble physics and foam dynamics research.

---

**Current Version**: vf7cffdb | **Status**: Active Development | **Performance**: 60 FPS @ 500+ bubbles
