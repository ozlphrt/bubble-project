# Technical Specifications - Soap Bubble Simulation

## Document Overview

**Purpose**: Define all technical elements, algorithms, physics formulas, and implementation details for the soap bubble simulation.

**Audience**: Developers (including AI assistants like Cursor) implementing the simulation.

**Scope**: 2D simulation with extensibility to 3D in Phase 2.

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                  index.html                      │
│  (UI Container + Canvas + Control Panels)        │
└─────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────┐
│                   main.js                        │
│         (Application Coordinator)                │
│  - Initialize modules                            │
│  - Run animation loop                            │
│  - Coordinate inter-module communication         │
└─────────────────────────────────────────────────┘
           ↓            ↓            ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Physics     │  │  Renderer    │  │ Interactions │
│  Module      │  │  Module      │  │   Module     │
└──────────────┘  └──────────────┘  └──────────────┘
       ↓                 ↓                  ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Bubble     │  │  Controls    │  │    Utils     │
│   Class      │  │   Module     │  │   Module     │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 1.2 Module Responsibilities

| Module | Responsibility | Dependencies |
|--------|----------------|--------------|
| **main.js** | Application lifecycle, animation loop | All modules |
| **bubble.js** | Bubble state and behavior | utils.js |
| **physics.js** | Physics calculations, collisions | bubble.js, utils.js |
| **renderer.js** | Canvas drawing, visualization | bubble.js |
| **interactions.js** | Mouse/keyboard input | bubble.js, physics.js |
| **controls.js** | UI parameter controls | interactions.js |
| **utils.js** | Helper functions, math utilities | None |

### 1.3 Data Flow

```
User Input → Interactions → Physics → Bubble State → Renderer → Canvas
                ↓              ↓
            Controls ←→ Parameters
```

---

## 2. Physics Engine Specification

### 2.1 Core Physics Constants

```javascript
const PHYSICS_CONSTANTS = {
    // Surface tension (N/m) - typical soap solution
    SURFACE_TENSION_DEFAULT: 0.025,      // 25 mN/m
    SURFACE_TENSION_MIN: 0.015,          // Water (~72 mN/m reduced by soap)
    SURFACE_TENSION_MAX: 0.050,          // Strong soap solution
    
    // Collision and contact
    COLLISION_DAMPING: 0.99,             // Energy loss per frame
    COLLISION_RESPONSE: 0.15,            // Collision force multiplier
    OVERLAP_TOLERANCE: 0.98,             // Allow 2% overlap before separation
    CONTACT_DETECTION_MULTIPLIER: 1.15,  // Detect contacts within 115% of combined radii
    
    // Deformation
    DEFORMATION_INFLUENCE_THRESHOLD: 0.3, // Min cos(angle) for deformation
    MIDPOINT_FLATTEN_STRENGTH: 1.0,       // How aggressively to flatten to midpoint
    
    // Bubble properties
    DEFAULT_RADIUS: 45,                   // px
    RADIUS_VARIATION: 0.6,                // ±60% variation
    MIN_RADIUS: 20,                       // px
    MAX_RADIUS: 100,                      // px
    
    // Bursting
    BURST_PRESSURE_THRESHOLD: 1.5,        // Relative pressure (1.0 = normal)
    BURST_FILM_THICKNESS_MIN: 10,         // nm (simplified)
    FRAGMENT_COUNT_MIN: 2,
    FRAGMENT_COUNT_MAX: 4,
    FRAGMENT_VELOCITY_SCALE: 2.0,         // Explosion velocity multiplier
    
    // Coalescence
    COALESCENCE_PROBABILITY: 0.01,        // Per frame when conditions met
    COALESCENCE_PRESSURE_THRESHOLD: 1.2,  // Relative pressure for rupture
    COALESCENCE_CONTACT_DURATION: 30,     // Frames in contact before merging
    
    // Environment
    GRAVITY: 0.05,                        // Downward acceleration (px/frame²)
    AIR_RESISTANCE: 0.99,                 // Velocity damping
    
    // Performance
    MAX_BUBBLES: 2000,                    // Hard limit
    QUADTREE_CAPACITY: 4,                 // Objects per quadtree node
    SEGMENT_COUNT_CIRCLE: 64,             // Rendering segments for perfect circle
    SEGMENT_COUNT_PERFORMANCE: 32,        // Reduced segments in performance mode
};
```

### 2.2 Surface Tension Model

**Physical Basis**: Young-Laplace equation relates pressure difference to surface curvature.

**Formula**:
```
ΔP = γ × κ
```
Where:
- `ΔP` = pressure difference across interface
- `γ` = surface tension coefficient
- `κ` = mean curvature (1/R₁ + 1/R₂)

**2D Simplification** (for circles):
```
ΔP = γ / r
```

**Implementation**:
```javascript
/**
 * Calculate pressure difference due to surface tension
 * @param {number} radius - Bubble radius in pixels
 * @param {number} surfaceTension - Surface tension coefficient
 * @returns {number} Pressure difference
 */
function calculateSurfacePressure(radius, surfaceTension) {
    // Young-Laplace for 2D (simplified)
    return surfaceTension / radius;
}
```

**Deformation Model**:
When bubbles contact, they flatten to minimize total surface energy. The deformation extends toward the midpoint between centers.

```javascript
/**
 * Calculate deformed radius at given angle
 * @param {Bubble} bubble - Current bubble
 * @param {number} angle - Angle from bubble center
 * @param {Array<Bubble>} contacts - Neighboring bubbles
 * @returns {number} Effective radius at this angle
 */
function calculateDeformedRadius(bubble, angle, contacts) {
    let r = bubble.radius;
    
    for (let contact of contacts) {
        const dx = contact.x - bubble.x;
        const dy = contact.y - bubble.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const contactAngle = Math.atan2(dy, dx);
        
        // Angular difference
        let angleDiff = angle - contactAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // Influence based on angle (cosine falloff)
        const influence = Math.cos(angleDiff);
        
        if (influence > DEFORMATION_INFLUENCE_THRESHOLD) {
            // Flatten toward midpoint
            const midpoint = dist / 2;
            const flattenAmount = influence * influence; // Quadratic for smoother transition
            r = Math.min(r, bubble.radius - (bubble.radius - midpoint) * flattenAmount);
        }
    }
    
    return r;
}
```

**References**:
- Plateau, J. (1873). "Statique expérimentale et théorique des liquides soumis aux seules forces moléculaires"
- Weaire, D., & Hutzler, S. (1999). "The Physics of Foams"

---

### 2.3 Plateau's Laws Implementation

**Law 1**: Three soap films meet at edges at 120° angles.

**Law 2**: Four edges meet at vertices at ~109.47° (tetrahedral angle) in 3D, but in 2D we have three edges at 120°.

**Detection Algorithm**:
```javascript
/**
 * Detect triple junction points (Plateau borders)
 * @param {Bubble} bubble - Bubble to check
 * @param {Array<Bubble>} allBubbles - All bubbles in simulation
 * @returns {Object} Junction info with angle compliance
 */
function detectTripleJunction(bubble, allBubbles) {
    // Find all neighbors
    const neighbors = [];
    
    for (let other of allBubbles) {
        if (other === bubble) continue;
        
        const dist = distance(bubble, other);
        if (dist < bubble.radius + other.radius + 5) {
            const angle = Math.atan2(other.y - bubble.y, other.x - bubble.x);
            neighbors.push({ bubble: other, angle });
        }
    }
    
    // Check for hexagonal packing (6 neighbors)
    if (neighbors.length === 6) {
        // Sort by angle
        neighbors.sort((a, b) => a.angle - b.angle);
        
        // Calculate angular separation
        let avgSeparation = 0;
        for (let i = 0; i < neighbors.length; i++) {
            const next = (i + 1) % neighbors.length;
            let sep = neighbors[next].angle - neighbors[i].angle;
            if (sep < 0) sep += 2 * Math.PI;
            avgSeparation += sep;
        }
        avgSeparation /= neighbors.length;
        
        // Check if close to 60° (π/3) - hexagonal packing
        const targetSeparation = Math.PI / 3;
        const tolerance = 0.1; // ~5.7 degrees
        
        if (Math.abs(avgSeparation - targetSeparation) < tolerance) {
            return {
                isJunction: true,
                compliance: 1.0 - Math.abs(avgSeparation - targetSeparation) / tolerance,
                neighborCount: 6
            };
        }
    }
    
    return { isJunction: false, compliance: 0, neighborCount: neighbors.length };
}
```

**Angle Calculation at Contact Points**:
```javascript
/**
 * Calculate angle at contact point between three bubbles
 * @param {Bubble} b1, b2, b3 - Three touching bubbles
 * @returns {number} Angle in radians at junction point
 */
function calculateJunctionAngle(b1, b2, b3) {
    // Find approximate junction point (weighted centroid)
    const jx = (b1.x + b2.x + b3.x) / 3;
    const jy = (b1.y + b2.y + b3.y) / 3;
    
    // Angles from junction to each bubble center
    const a1 = Math.atan2(b1.y - jy, b1.x - jx);
    const a2 = Math.atan2(b2.y - jy, b2.x - jx);
    const a3 = Math.atan2(b3.y - jy, b3.x - jx);
    
    // Calculate angles between rays
    const angles = [
        normalizeAngle(a2 - a1),
        normalizeAngle(a3 - a2),
        normalizeAngle(a1 - a3)
    ];
    
    // Should all be ~120° (2π/3)
    return angles;
}
```

**Visual Representation**:
- Highlight junctions with dots
- Draw thicker lines at Plateau borders
- Color-code by angle compliance (green = 120°, yellow = close, red = far)

**References**:
- Plateau, J. (1873). "Statique expérimentale et théorique des liquides soumis aux seules forces moléculaires"
- Taylor, J. E. (1976). "The structure of singularities in soap-bubble-like and soap-film-like minimal surfaces"

---

### 2.4 Collision Detection & Response

**Broad Phase: Spatial Partitioning (Quadtree)**

```javascript
class Quadtree {
    constructor(boundary, capacity) {
        this.boundary = boundary;    // {x, y, width, height}
        this.capacity = capacity;    // Max objects before subdivision
        this.bubbles = [];
        this.divided = false;
        this.children = null;
    }
    
    /**
     * Insert bubble into quadtree
     */
    insert(bubble) {
        if (!this.boundary.contains(bubble)) return false;
        
        if (this.bubbles.length < this.capacity) {
            this.bubbles.push(bubble);
            return true;
        }
        
        if (!this.divided) this.subdivide();
        
        for (let child of this.children) {
            if (child.insert(bubble)) return true;
        }
        
        return false;
    }
    
    /**
     * Query bubbles in range
     */
    query(range, found = []) {
        if (!this.boundary.intersects(range)) return found;
        
        for (let bubble of this.bubbles) {
            if (range.contains(bubble)) found.push(bubble);
        }
        
        if (this.divided) {
            for (let child of this.children) {
                child.query(range, found);
            }
        }
        
        return found;
    }
    
    /**
     * Subdivide into four children
     */
    subdivide() {
        const x = this.boundary.x;
        const y = this.boundary.y;
        const w = this.boundary.width / 2;
        const h = this.boundary.height / 2;
        
        this.children = [
            new Quadtree({x, y, width: w, height: h}, this.capacity),
            new Quadtree({x: x + w, y, width: w, height: h}, this.capacity),
            new Quadtree({x, y: y + h, width: w, height: h}, this.capacity),
            new Quadtree({x: x + w, y: y + h, width: w, height: h}, this.capacity)
        ];
        
        this.divided = true;
    }
}
```

**Narrow Phase: Circle-Circle Collision**

```javascript
/**
 * Detect and resolve collision between two bubbles
 * @param {Bubble} b1 - First bubble
 * @param {Bubble} b2 - Second bubble
 */
function handleCollision(b1, b2) {
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = b1.radius + b2.radius;
    const targetDist = minDist * OVERLAP_TOLERANCE;
    
    if (dist < targetDist && dist > 0) {
        // Collision normal
        const nx = dx / dist;
        const ny = dy / dist;
        
        // Penetration depth
        const overlap = targetDist - dist;
        
        // Separate bubbles (soft separation)
        const separation = overlap * 0.05; // Very soft
        b1.x -= nx * separation;
        b1.y -= ny * separation;
        b2.x += nx * separation;
        b2.y += ny * separation;
        
        // Velocity adjustment (elastic collision with damping)
        const dvx = b2.vx - b1.vx;
        const dvy = b2.vy - b1.vy;
        const dvn = dvx * nx + dvy * ny; // Relative velocity along normal
        
        // Only resolve if bubbles are approaching
        if (dvn < 0) {
            const impulse = dvn * COLLISION_RESPONSE;
            b1.vx += nx * impulse;
            b1.vy += ny * impulse;
            b2.vx -= nx * impulse;
            b2.vy -= ny * impulse;
        }
    }
}
```

**Complexity Analysis**:
- Without quadtree: O(n²) - check all pairs
- With quadtree: O(n log n) - query limited regions
- Target: Handle 1000 bubbles at 60 FPS

---

### 2.5 Coalescence Dynamics

**Physical Basis**: Bubbles merge when the film between them ruptures due to:
1. Film thinning over time
2. Pressure differential
3. Surface instabilities

**Rupture Condition**:
```javascript
/**
 * Check if two bubbles should coalesce
 * @param {Bubble} b1 - First bubble
 * @param {Bubble} b2 - Second bubble
 * @param {number} contactDuration - Frames in contact
 * @returns {boolean} Should merge
 */
function shouldCoalesce(b1, b2, contactDuration) {
    // Must be in sustained contact
    if (contactDuration < COALESCENCE_CONTACT_DURATION) return false;
    
    // Calculate pressure at contact
    const p1 = calculateSurfacePressure(b1.radius, b1.surfaceTension);
    const p2 = calculateSurfacePressure(b2.radius, b2.surfaceTension);
    const pressureDiff = Math.abs(p1 - p2);
    
    // High pressure difference increases rupture probability
    const pressureFactor = pressureDiff / Math.min(p1, p2);
    
    // Stochastic rupture
    const ruptureProbability = COALESCENCE_PROBABILITY * (1 + pressureFactor);
    
    return Math.random() < ruptureProbability;
}
```

**Merging Algorithm**:
```javascript
/**
 * Merge two bubbles into one
 * @param {Bubble} b1 - First bubble
 * @param {Bubble} b2 - Second bubble
 * @returns {Bubble} New merged bubble
 */
function mergeBubbles(b1, b2) {
    // Volume conservation (area in 2D)
    const area1 = Math.PI * b1.radius * b1.radius;
    const area2 = Math.PI * b2.radius * b2.radius;
    const totalArea = area1 + area2;
    const newRadius = Math.sqrt(totalArea / Math.PI);
    
    // Weighted center of mass
    const mass1 = area1;
    const mass2 = area2;
    const totalMass = mass1 + mass2;
    const newX = (b1.x * mass1 + b2.x * mass2) / totalMass;
    const newY = (b1.y * mass1 + b2.y * mass2) / totalMass;
    
    // Momentum conservation
    const newVx = (b1.vx * mass1 + b2.vx * mass2) / totalMass;
    const newVy = (b1.vy * mass1 + b2.vy * mass2) / totalMass;
    
    // Create new bubble
    const merged = new Bubble(newX, newY, newRadius);
    merged.vx = newVx;
    merged.vy = newVy;
    
    // Blend colors
    merged.color = blendColors(b1.color, b2.color);
    
    return merged;
}
```

**References**:
- Bremond, N., & Villermaux, E. (2006). "Atomization by jet impact"
- Paulsen, J. D., et al. (2012). "The inexorable resistance of inertia determines the initial regime of drop coalescence"

---

### 2.6 Bubble Bursting Mechanics

**Burst Conditions**:
1. **Pressure threshold**: Internal pressure exceeds limit
2. **Film thickness**: Film becomes too thin
3. **External force**: Collision or boundary impact

**Pressure-Based Bursting**:
```javascript
/**
 * Check if bubble should burst due to pressure
 * @param {Bubble} bubble - Bubble to check
 * @param {Array<Bubble>} neighbors - Nearby bubbles applying pressure
 * @returns {boolean} Should burst
 */
function shouldBurstFromPressure(bubble, neighbors) {
    // Calculate internal pressure
    const internalPressure = calculateSurfacePressure(bubble.radius, bubble.surfaceTension);
    
    // External pressure from compression
    let externalPressure = 0;
    for (let neighbor of neighbors) {
        const dist = distance(bubble, neighbor);
        const overlap = bubble.radius + neighbor.radius - dist;
        if (overlap > 0) {
            externalPressure += overlap / bubble.radius; // Normalized pressure
        }
    }
    
    // Total pressure relative to normal
    const totalPressure = (internalPressure + externalPressure) / internalPressure;
    
    return totalPressure > BURST_PRESSURE_THRESHOLD;
}
```

**Fragmentation**:
```javascript
/**
 * Fragment bursting bubble into smaller bubbles
 * @param {Bubble} bubble - Bursting bubble
 * @returns {Array<Bubble>} Fragment bubbles
 */
function fragmentBubble(bubble) {
    const fragments = [];
    
    // Number of fragments based on size
    const fragmentCount = Math.floor(
        FRAGMENT_COUNT_MIN + 
        Math.random() * (FRAGMENT_COUNT_MAX - FRAGMENT_COUNT_MIN + 1)
    );
    
    // Total volume to conserve
    const totalArea = Math.PI * bubble.radius * bubble.radius;
    const fragmentArea = totalArea / fragmentCount;
    const fragmentRadius = Math.sqrt(fragmentArea / Math.PI);
    
    // Create fragments in a circle around burst point
    for (let i = 0; i < fragmentCount; i++) {
        const angle = (i / fragmentCount) * 2 * Math.PI + Math.random() * 0.5;
        const distance = bubble.radius * 0.5;
        
        const fx = bubble.x + Math.cos(angle) * distance;
        const fy = bubble.y + Math.sin(angle) * distance;
        
        const fragment = new Bubble(fx, fy, fragmentRadius);
        
        // Explosive velocity
        fragment.vx = Math.cos(angle) * FRAGMENT_VELOCITY_SCALE + bubble.vx;
        fragment.vy = Math.sin(angle) * FRAGMENT_VELOCITY_SCALE + bubble.vy;
        
        // Similar color with variation
        fragment.color = varyColor(bubble.color);
        
        fragments.push(fragment);
    }
    
    return fragments;
}
```

**Burst Visual Effect**:
```javascript
/**
 * Create particle effect for burst
 * @param {Bubble} bubble - Bursting bubble
 * @returns {Array<Particle>} Particles for animation
 */
function createBurstEffect(bubble) {
    const particles = [];
    const particleCount = Math.floor(bubble.radius / 3);
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = 1 + Math.random() * 3;
        
        particles.push({
            x: bubble.x,
            y: bubble.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 30, // frames
            size: 2 + Math.random() * 3,
            color: bubble.color
        });
    }
    
    return particles;
}
```

**References**:
- Lhuissier, H., & Villermaux, E. (2012). "Bursting bubble aerosols"
- Walls, P. L. L., et al. (2015). "Jet drops from bursting bubbles: How gravity and viscosity couple to inhibit droplet production"

---

### 2.7 Marangoni Effect (Tier 3)

**Physical Basis**: Surface tension gradients drive fluid flow along interfaces.

**Simplified Model**:
```javascript
/**
 * Calculate Marangoni flow at bubble surface
 * @param {Bubble} bubble - Bubble
 * @param {number} angle - Position on bubble surface
 * @returns {Object} Flow velocity and direction
 */
function calculateMarangoniFlow(bubble, angle) {
    // Simulate temperature or concentration gradient
    // Higher at top (heated), lower at bottom
    const gradientStrength = 0.1 * Math.sin(angle);
    
    // Flow direction (tangent to surface, toward higher tension)
    const flowAngle = angle + Math.PI / 2;
    const flowSpeed = gradientStrength * 0.5;
    
    return {
        vx: Math.cos(flowAngle) * flowSpeed,
        vy: Math.sin(flowAngle) * flowSpeed,
        gradient: gradientStrength
    };
}
```

**Visualization**: Color or thickness gradient showing surface tension variation

**References**:
- Marangoni, C. (1865). "On the expansion of a drop of liquid floating on the surface of another liquid"
- Berg, J. C. (2010). "An Introduction to Interfaces & Colloids: The Bridge to Nanoscience"

---

### 2.8 Gas Pressure & Young-Laplace (Tier 3)

**Young-Laplace Equation** (full):
```
ΔP = γ × (1/R₁ + 1/R₂)
```

For a soap bubble (two surfaces):
```
ΔP = 4γ / r
```

**Implementation**:
```javascript
/**
 * Calculate internal gas pressure using Young-Laplace
 * @param {Bubble} bubble - Bubble
 * @param {number} surfaceTension - γ
 * @param {number} externalPressure - P_outside
 * @returns {number} Internal pressure
 */
function calculateInternalPressure(bubble, surfaceTension, externalPressure) {
    // Young-Laplace for soap bubble (two surfaces)
    const pressureIncrease = (4 * surfaceTension) / bubble.radius;
    return externalPressure + pressureIncrease;
}
```

**Pressure Visualization**:
- Color intensity based on pressure
- Smaller bubbles are brighter (higher pressure)

**References**:
- Young, T. (1805). "An Essay on the Cohesion of Fluids"
- Laplace, P. S. (1806). "Traité de Mécanique Céleste, Supplement to the Tenth Book"

---

### 2.9 Liquid Drainage (Tier 3)

**Physical Model**: Gravity-driven drainage thins films over time.

```javascript
/**
 * Update film thickness due to drainage
 * @param {Bubble} bubble - Bubble
 * @param {number} dt - Time step
 */
function updateFilmThickness(bubble, dt) {
    // Drainage rate proportional to gravity and inverse to viscosity
    const drainageRate = GRAVITY * dt / (bubble.viscosity || 1.0);
    
    // Thickness decreases over time
    bubble.filmThickness = Math.max(
        BURST_FILM_THICKNESS_MIN,
        bubble.filmThickness - drainageRate
    );
    
    // Check for rupture when too thin
    if (bubble.filmThickness <= BURST_FILM_THICKNESS_MIN) {
        return true; // Should burst
    }
    
    return false;
}
```

**Visualization**: Film becomes more transparent as it thins

**References**:
- Mysels, K. J., et al. (1959). "Soap Films: Studies of Their Thinning"
- Schwartz, L. W., & Roy, R. V. (1999). "Modeling draining flow in mobile and immobile soap films"

---

## 3. Bubble Class Specification

### 3.1 Class Definition

```javascript
/**
 * Bubble class representing a single soap bubble
 */
class Bubble {
    /**
     * Create a bubble
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} radius - Bubble radius
     */
    constructor(x, y, radius) {
        // Position
        this.x = x;
        this.y = y;
        
        // Kinematics
        this.radius = radius;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        
        // Physics properties
        this.mass = Math.PI * radius * radius; // Area as mass in 2D
        this.surfaceTension = PHYSICS_CONSTANTS.SURFACE_TENSION_DEFAULT;
        this.filmThickness = 100; // nm (starting thickness)
        this.pressure = 0; // Internal pressure
        
        // State
        this.age = 0; // Frames since creation
        this.contactDurations = new Map(); // Track contact time with other bubbles
        
        // Visual
        this.color = this.generateColor();
        this.opacity = 0.8;
        
        // Metadata
        this.id = Bubble.nextId++;
    }
    
    /**
     * Update bubble physics (one timestep)
     * @param {number} dt - Delta time (usually 1 frame)
     */
    update(dt) {
        // Apply acceleration
        this.vx += this.ax * dt;
        this.vy += this.ay * dt;
        
        // Apply gravity
        this.vy += PHYSICS_CONSTANTS.GRAVITY * dt;
        
        // Apply air resistance
        this.vx *= PHYSICS_CONSTANTS.AIR_RESISTANCE;
        this.vy *= PHYSICS_CONSTANTS.AIR_RESISTANCE;
        
        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Reset acceleration
        this.ax = 0;
        this.ay = 0;
        
        // Increment age
        this.age++;
        
        // Update film thickness (drainage)
        if (ENABLE_DRAINAGE) {
            this.updateFilmThickness(dt);
        }
    }
    
    /**
     * Apply force to bubble
     * @param {number} fx - Force X
     * @param {number} fy - Force Y
     */
    applyForce(fx, fy) {
        this.ax += fx / this.mass;
        this.ay += fy / this.mass;
    }
    
    /**
     * Check collision with another bubble
     * @param {Bubble} other - Other bubble
     * @returns {boolean} Are they colliding
     */
    isCollidingWith(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.radius + other.radius;
    }
    
    /**
     * Calculate deformed shape for rendering
     * @param {Array<Bubble>} contacts - Bubbles in contact
     * @returns {Array<Point>} Deformed perimeter points
     */
    calculateDeformedShape(contacts) {
        const points = [];
        const segments = PHYSICS_CONSTANTS.SEGMENT_COUNT_CIRCLE;
        
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * 2 * Math.PI;
            const r = calculateDeformedRadius(this, angle, contacts);
            
            points.push({
                x: this.x + Math.cos(angle) * r,
                y: this.y + Math.sin(angle) * r
            });
        }
        
        return points;
    }
    
    /**
     * Generate random color
     * @returns {string} HSL color string
     */
    generateColor() {
        const hue = Math.random() * 360;
        const sat = 60 + Math.random() * 20;
        const light = 50 + Math.random() * 20;
        return `hsl(${hue}, ${sat}%, ${light}%)`;
    }
    
    /**
     * Update film thickness (drainage simulation)
     */
    updateFilmThickness(dt) {
        const drainageRate = PHYSICS_CONSTANTS.GRAVITY * dt * 0.1;
        this.filmThickness = Math.max(
            PHYSICS_CONSTANTS.BURST_FILM_THICKNESS_MIN,
            this.filmThickness - drainageRate
        );
    }
    
    /**
     * Clone bubble
     * @returns {Bubble} New bubble with same properties
     */
    clone() {
        const b = new Bubble(this.x, this.y, this.radius);
        b.vx = this.vx;
        b.vy = this.vy;
        b.color = this.color;
        b.surfaceTension = this.surfaceTension;
        return b;
    }
}

Bubble.nextId = 0;
```

---

## 4. Renderer Module Specification

### 4.1 Rendering Pipeline

```javascript
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.performanceMode = false;
    }
    
    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Render all bubbles
     * @param {Array<Bubble>} bubbles - All bubbles
     * @param {Object} options - Rendering options
     */
    renderBubbles(bubbles, options = {}) {
        for (let bubble of bubbles) {
            const contacts = this.findContacts(bubble, bubbles);
            this.renderBubble(bubble, contacts, options);
        }
    }
    
    /**
     * Render single bubble
     * @param {Bubble} bubble - Bubble to render
     * @param {Array<Bubble>} contacts - Contacting bubbles
     * @param {Object} options - Visual options
     */
    renderBubble(bubble, contacts, options) {
        const ctx = this.ctx;
        
        // Get deformed shape
        const shape = bubble.calculateDeformedShape(contacts);
        
        // Draw fill
        ctx.beginPath();
        ctx.moveTo(shape[0].x, shape[0].y);
        for (let i = 1; i < shape.length; i++) {
            ctx.lineTo(shape[i].x, shape[i].y);
        }
        ctx.closePath();
        
        // Fill with color
        ctx.fillStyle = this.addAlpha(bubble.color, bubble.opacity);
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = options.borderColor || '#00ff88';
        ctx.lineWidth = options.borderWidth || 2;
        ctx.stroke();
        
        // Optional: draw pressure visualization
        if (options.showPressure) {
            this.visualizePressure(bubble);
        }
        
        // Optional: draw Plateau borders
        if (options.showPlateauBorders && contacts.length >= 2) {
            this.renderPlateauBorders(bubble, contacts);
        }
    }
    
    /**
     * Render Plateau border highlighting
     */
    renderPlateauBorders(bubble, contacts) {
        // Highlight triple junctions
        const junction = detectTripleJunction(bubble, contacts);
        
        if (junction.isJunction) {
            const ctx = this.ctx;
            
            // Draw junction indicator
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, 5, 0, 2 * Math.PI);
            
            // Color based on compliance
            const compliance = junction.compliance;
            ctx.fillStyle = `rgb(${255 * (1 - compliance)}, ${255 * compliance}, 0)`;
            ctx.fill();
            
            // Draw text
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.fillText('120°', bubble.x + 8, bubble.y - 8);
        }
    }
    
    /**
     * Render burst effect particles
     */
    renderBurstEffect(particles) {
        const ctx = this.ctx;
        
        for (let p of particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
            ctx.fillStyle = this.addAlpha(p.color, p.life / 30);
            ctx.fill();
            
            // Update particle
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
        }
        
        // Remove dead particles
        return particles.filter(p => p.life > 0);
    }
    
    /**
     * Add alpha to color string
     */
    addAlpha(color, alpha) {
        if (color.startsWith('hsl')) {
            return color.replace('hsl', 'hsla').replace(')', `, ${alpha})`);
        }
        return color;
    }
    
    /**
     * Render UI overlay (FPS, bubble count, etc.)
     */
    renderUI(stats) {
        const ctx = this.ctx;
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.fillText(`FPS: ${stats.fps}`, 10, 20);
        ctx.fillText(`Bubbles: ${stats.bubbleCount}`, 10, 40);
        ctx.fillText(`Update: ${stats.updateTime}ms`, 10, 60);
    }
}
```

---

## 5. Performance Specifications

### 5.1 Target Performance Metrics

| Metric | Target | Minimum Acceptable |
|--------|--------|-------------------|
| FPS (500 bubbles) | 60 | 45 |
| FPS (1000 bubbles) | 45 | 30 |
| Frame time | 16.67ms | 33ms |
| Memory (1000 bubbles) | 150MB | 200MB |
| Startup time | 1s | 2s |
| Input latency | <16ms | <32ms |

### 5.2 Optimization Techniques

**Spatial Partitioning**:
- Quadtree reduces collision detection from O(n²) to O(n log n)
- Rebuild quadtree every frame
- Query only relevant regions

**Rendering Optimization**:
- Reduce segment count in performance mode (64 → 32)
- Skip non-visible effects
- Use dirty regions (only redraw changed areas)
- Cache gradient calculations

**Physics Optimization**:
- Early exit for distant bubbles
- Skip micro-contacts (< 1px overlap)
- Batch force calculations
- Use simplified models when appropriate

**Memory Optimization**:
- Object pooling for particles
- Reuse arrays where possible
- Clean up burst bubbles immediately
- Limit maximum bubble count

---

## 6. Configuration Parameters

### 6.1 User-Adjustable Parameters

```javascript
const USER_PARAMETERS = {
    // Primary controls
    surfaceTension: {
        min: 0.015,
        max: 0.050,
        default: 0.025,
        step: 0.001,
        unit: 'N/m',
        description: 'Surface tension coefficient (higher = less deformation)'
    },
    
    bubbleSoftness: {
        min: 0.0,
        max: 1.0,
        default: 0.5,
        step: 0.01,
        unit: 'ratio',
        description: 'How easily bubbles deform (0 = rigid, 1 = very soft)'
    },
    
    gravity: {
        min: 0.0,
        max: 0.5,
        default: 0.05,
        step: 0.01,
        unit: 'px/frame²',
        description: 'Downward acceleration'
    },
    
    burstPressure: {
        min: 1.0,
        max: 3.0,
        default: 1.5,
        step: 0.1,
        unit: 'ratio',
        description: 'Pressure threshold for bursting (1.0 = normal)'
    },
    
    // Secondary controls
    coalescenceProbability: {
        min: 0.0,
        max: 0.1,
        default: 0.01,
        step: 0.001,
        unit: 'probability',
        description: 'Chance of merging per frame'
    },
    
    filmThickness: {
        min: 10,
        max: 200,
        default: 100,
        unit: 'nm',
        description: 'Initial film thickness'
    },
    
    animationSpeed: {
        min: 0.1,
        max: 2.0,
        default: 1.0,
        step: 0.1,
        unit: 'multiplier',
        description: 'Simulation speed multiplier'
    }
};
```

### 6.2 Developer Constants

```javascript
const DEV_CONSTANTS = {
    DEBUG_MODE: false,
    SHOW_QUADTREE: false,
    SHOW_CONTACTS: false,
    SHOW_VELOCITIES: false,
    LOG_PERFORMANCE: false,
    ENABLE_DRAINAGE: true,
    ENABLE_MARANGONI: false, // Tier 3
    ENABLE_COALESCENCE: true,
    ENABLE_BURSTING: true
};
```

---

## 7. Module APIs

### 7.1 Physics Module API

```javascript
Physics.detectCollisions(bubbles, quadtree) → void
Physics.findContacts(bubble, bubbles) → Array<Bubble>
Physics.updatePositions(bubbles, dt) → void
Physics.shouldCoalesce(b1, b2, duration) → boolean
Physics.mergeBubbles(b1, b2) → Bubble
Physics.shouldBurst(bubble, neighbors) → boolean
Physics.fragmentBubble(bubble) → Array<Bubble>
```

### 7.2 Renderer Module API

```javascript
Renderer.clear() → void
Renderer.renderBubbles(bubbles, options) → void
Renderer.renderBubble(bubble, contacts, options) → void
Renderer.renderUI(stats) → void
Renderer.renderBurstEffect(particles) → Array<Particle>
Renderer.setPerformanceMode(enabled) → void
```

### 7.3 Interactions Module API

```javascript
Interactions.init(canvas) → void
Interactions.onMouseClick(callback) → void
Interactions.onMouseDrag(callback) → void
Interactions.onMouseHover(callback) → void
Interactions.onKeyPress(callback) → void
Interactions.getMousePosition() → {x, y}
```

### 7.4 Controls Module API

```javascript
Controls.init(container) → void
Controls.addParameter(name, config) → void
Controls.getValue(name) → number
Controls.setValue(name, value) → void
Controls.onParameterChange(callback) → void
Controls.show() → void
Controls.hide() → void
```

---

## 8. Research References

### 8.1 Primary Sources

1. **Plateau, J. (1873)**. "Statique expérimentale et théorique des liquides soumis aux seules forces moléculaires"
   - Foundation of foam physics
   - Plateau's laws

2. **Weaire, D., & Hutzler, S. (1999)**. "The Physics of Foams"
   - Comprehensive foam physics
   - Modern applications

3. **Young, T. (1805)**. "An Essay on the Cohesion of Fluids"
   - Surface tension theory
   - Young-Laplace equation

4. **Taylor, J. E. (1976)**. "The structure of singularities in soap-bubble-like and soap-film-like minimal surfaces"
   - Mathematical analysis of Plateau borders
   - Proof of angle requirements

### 8.2 Computational Methods

5. **Durand, M., & Stone, H. A. (2006)**. "Relaxation time of the topological T1 process in a two-dimensional foam"
   - 2D foam dynamics
   - Computational approaches

6. **Brakke, K. A. (1992)**. "The Surface Evolver"
   - Surface minimization algorithms
   - Computational geometry

### 8.3 Coalescence & Bursting

7. **Paulsen, J. D., et al. (2012)**. "The inexorable resistance of inertia determines the initial regime of drop coalescence"
   - Physics of merging

8. **Lhuissier, H., & Villermaux, E. (2012)**. "Bursting bubble aerosols"
   - Burst mechanics
   - Fragmentation patterns

### 8.4 Online Resources

9. **Wikipedia**: Surface tension, Young-Laplace equation, Plateau's laws
10. **Physics Stack Exchange**: Foam dynamics discussions
11. **YouTube**: Slow-motion bubble physics demonstrations

---

## 9. Testing Specifications

### 9.1 Unit Test Coverage

**Physics Module**:
- Collision detection accuracy
- Volume conservation in merges
- Pressure calculations
- Boundary conditions

**Bubble Class**:
- Constructor validation
- Update method
- Force application
- Collision detection

**Utilities**:
- Distance calculations
- Angle normalization
- Color blending
- Array operations

### 9.2 Visual Test Cases

1. **Honeycomb Formation**: 50+ bubbles compress to show hexagonal pattern
2. **120° Angles**: Zoom on triple junction shows correct angles
3. **Bubble Burst**: Single bubble bursts into 2-4 fragments
4. **Bubble Merge**: Two bubbles coalesce smoothly
5. **Surface Tension**: Adjusting parameter visibly changes deformation

### 9.3 Performance Test Cases

1. **100 Bubbles**: Maintain 60 FPS
2. **500 Bubbles**: Maintain 60 FPS with quadtree
3. **1000 Bubbles**: Maintain 30+ FPS
4. **Burst Stress Test**: Burst 50 bubbles simultaneously

---

## 10. Browser Compatibility

### 10.1 Target Browsers

- Chrome/Edge (Chromium) 90+
- Firefox 88+
- Safari 14+

### 10.2 Required Features

- Canvas 2D API
- ES6 Modules
- RequestAnimationFrame
- CSS Grid
- CSS Custom Properties

### 10.3 Polyfills (if needed)

- None required for modern browsers
- Graceful degradation for older browsers

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Status**: Awaiting Approval  
**Next Document**: Test Procedures