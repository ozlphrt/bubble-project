# Soap Bubble Simulation

An interactive, educational web-based simulation demonstrating the physics of soap bubbles and foam formation. This project showcases real foam physics including Plateau's laws, surface tension, coalescence, and bursting mechanics through interactive visualization.

## 🫧 Features

- **Real Physics**: Implements surface tension, Plateau's laws, and bubble dynamics
- **Interactive Controls**: Adjust physics parameters with hover + drag interface
- **Educational**: Learn foam physics through play and experimentation
- **Performance**: Handles 500+ bubbles at 60 FPS
- **Modular Architecture**: Clean, maintainable code ready for 3D expansion

## 🚀 Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/[username]/soap-bubble-simulation.git
   cd soap-bubble-simulation
   ```

2. Open `index.html` in a modern web browser

3. Start experimenting:
   - Click to add bubbles
   - Use controls to adjust physics parameters
   - Watch bubbles form hexagonal patterns under compression

## 🎯 Educational Value

This simulation demonstrates key physics concepts:

- **Plateau's Laws**: Three films meet at 120° angles
- **Surface Tension**: Minimizes surface area and affects deformation
- **Coalescence**: Bubbles merge when films rupture
- **Bursting**: Pressure-based fragmentation into smaller bubbles

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Graphics**: Canvas 2D API
- **Physics**: Custom implementation with academic references
- **Deployment**: GitHub Pages with automated CI/CD

## 📚 Documentation

- [Project Overview & PRD](project-overview-prd.md)
- [Technical Specifications](technical-specs.md)
- [Detailed Task List](detailed-task-list.md)
- [Test Procedures](test-procedures.md)
- [Git Workflow](git-workflow.md)

## 🧪 Physics Implementation

### Tier 1 (Core Physics)
- Surface tension modeling with Young-Laplace equation
- Plateau border visualization (120° angles)
- Contact detection and deformation

### Tier 2 (Advanced Dynamics)
- Coalescence with volume conservation
- Pressure-based bursting mechanics
- Fragmentation into smaller bubbles

### Tier 3 (Enhanced Effects)
- Marangoni effect (surface tension gradients)
- Liquid drainage simulation
- Gas pressure calculations

## 🎮 Controls

- **Mouse Click**: Add bubble at cursor position
- **Hover + Drag**: Adjust physics parameters
- **Action Buttons**: Add bubbles, compress, shake, reset

## 📊 Performance

- **Target**: 60 FPS with 500 bubbles
- **Optimization**: Quadtree spatial partitioning
- **Monitoring**: Real-time FPS and performance stats

## 🔬 Research References

This simulation is based on established physics research:

- Plateau, J. (1873). "Statique expérimentale et théorique des liquides"
- Weaire, D., & Hutzler, S. (1999). "The Physics of Foams"
- Young, T. (1805). "An Essay on the Cohesion of Fluids"

## 🤝 Contributing

This is an educational project. Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Follow the coding standards
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎓 Educational Use

Perfect for:
- Physics education (surface tension, fluid dynamics)
- Interactive demonstrations
- Student projects and research
- Understanding emergent behavior in complex systems

## 🔮 Future Roadmap

- **Phase 2**: 3D simulation with WebGL
- **Enhancements**: VR support, multi-user collaboration
- **Advanced Physics**: Turbulence, temperature effects

---

**Live Demo**: [https://[username].github.io/soap-bubble-simulation/](https://[username].github.io/soap-bubble-simulation/)

**Status**: Phase 1 (2D Simulation) - In Development

