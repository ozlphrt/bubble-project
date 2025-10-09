# Test Procedures - Soap Bubble Simulation

## Document Overview

**Purpose**: Define comprehensive testing procedures to ensure simulation quality, correctness, and performance.

**Scope**: All testing activities from unit tests to user acceptance testing.

**Audience**: Developers and CI/CD systems.

---

## 1. Testing Strategy

### 1.1 Test Pyramid

```
           ┌─────────────┐
           │   Manual    │  ← 5% (Exploratory, UX)
           │   Testing   │
           └─────────────┘
         ┌─────────────────┐
         │  Integration &  │  ← 15% (Module interactions)
         │  Visual Tests   │
         └─────────────────┘
       ┌─────────────────────┐
       │    Unit Tests       │  ← 60% (Functions, classes)
       └─────────────────────┘
     ┌─────────────────────────┐
     │  Performance Tests      │  ← 20% (Benchmarks, stress)
     └─────────────────────────┘
```

### 1.2 Test Types & Coverage Targets

| Test Type | Coverage Target | Automation | Priority |
|-----------|----------------|------------|----------|
| Unit Tests | 80%+ | Full | P0 |
| Integration Tests | Key workflows | Full | P1 |
| Visual Regression | 10 scenarios | Full | P1 |
| Performance Tests | 5 benchmarks | Full | P1 |
| Browser Compatibility | 4 browsers | Manual + Automated | P1 |
| User Acceptance | Core features | Manual | P2 |

### 1.3 Testing Tools

**Unit Testing**:
- Framework: Jest or Mocha
- Assertion: Chai
- Coverage: Istanbul/NYC

**Visual Testing**:
- Tool: Playwright or Puppeteer
- Screenshot comparison: Pixelmatch

**Performance Testing**:
- Tool: Custom benchmark suite
- Profiling: Chrome DevTools

**CI/CD**:
- Platform: GitHub Actions
- Test reporting: GitHub Actions native

---

## 2. Unit Testing Procedures

### 2.1 Physics Module Tests

**File**: `tests/physics.test.js`

```javascript
import { Physics } from '../src/modules/physics.js';
import { Bubble } from '../src/modules/bubble.js';

describe('Physics Module', () => {
    
    describe('Collision Detection', () => {
        test('should detect collision when bubbles overlap', () => {
            const b1 = new Bubble(0, 0, 50);
            const b2 = new Bubble(60, 0, 50);
            
            expect(Physics.detectCollision(b1, b2)).toBe(true);
        });
        
        test('should not detect collision when bubbles are far apart', () => {
            const b1 = new Bubble(0, 0, 50);
            const b2 = new Bubble(200, 0, 50);
            
            expect(Physics.detectCollision(b1, b2)).toBe(false);
        });
        
        test('should handle edge case of exactly touching bubbles', () => {
            const b1 = new Bubble(0, 0, 50);
            const b2 = new Bubble(100, 0, 50);
            
            expect(Physics.detectCollision(b1, b2)).toBe(true);
        });
    });
    
    describe('Surface Pressure Calculation', () => {
        test('should calculate pressure inversely proportional to radius', () => {
            const pressure1 = Physics.calculateSurfacePressure(50, 0.025);
            const pressure2 = Physics.calculateSurfacePressure(100, 0.025);
            
            expect(pressure1).toBeCloseTo(pressure2 * 2, 2);
        });
        
        test('should scale with surface tension', () => {
            const pressure1 = Physics.calculateSurfacePressure(50, 0.025);
            const pressure2 = Physics.calculateSurfacePressure(50, 0.050);
            
            expect(pressure2).toBeCloseTo(pressure1 * 2, 2);
        });
    });
    
    describe('Bubble Merging', () => {
        test('should conserve volume when merging bubbles', () => {
            const b1 = new Bubble(0, 0, 50);
            const b2 = new Bubble(100, 0, 30);
            
            const area1 = Math.PI * b1.radius * b1.radius;
            const area2 = Math.PI * b2.radius * b2.radius;
            const totalArea = area1 + area2;
            
            const merged = Physics.mergeBubbles(b1, b2);
            const mergedArea = Math.PI * merged.radius * merged.radius;
            
            expect(mergedArea).toBeCloseTo(totalArea, 1);
        });
        
        test('should place merged bubble at weighted center', () => {
            const b1 = new Bubble(0, 0, 50);
            const b2 = new Bubble(100, 0, 50);
            
            const merged = Physics.mergeBubbles(b1, b2);
            
            expect(merged.x).toBeCloseTo(50, 1);
            expect(merged.y).toBeCloseTo(0, 1);
        });
        
        test('should conserve momentum', () => {
            const b1 = new Bubble(0, 0, 50);
            b1.vx = 2;
            b1.vy = 0;
            
            const b2 = new Bubble(100, 0, 50);
            b2.vx = 0;
            b2.vy = 2;
            
            const m1 = Math.PI * 50 * 50;
            const m2 = Math.PI * 50 * 50;
            const totalMomentumX = m1 * b1.vx + m2 * b2.vx;
            const totalMomentumY = m1 * b1.vy + m2 * b2.vy;
            
            const merged = Physics.mergeBubbles(b1, b2);
            const mergedMass = Math.PI * merged.radius * merged.radius;
            const mergedMomentumX = mergedMass * merged.vx;
            const mergedMomentumY = mergedMass * merged.vy;
            
            expect(mergedMomentumX).toBeCloseTo(totalMomentumX, 1);
            expect(mergedMomentumY).toBeCloseTo(totalMomentumY, 1);
        });
    });
    
    describe('Bubble Fragmentation', () => {
        test('should create 2-4 fragments', () => {
            const bubble = new Bubble(100, 100, 80);
            const fragments = Physics.fragmentBubble(bubble);
            
            expect(fragments.length).toBeGreaterThanOrEqual(2);
            expect(fragments.length).toBeLessThanOrEqual(4);
        });
        
        test('should conserve total volume in fragments', () => {
            const bubble = new Bubble(100, 100, 80);
            const originalArea = Math.PI * bubble.radius * bubble.radius;
            
            const fragments = Physics.fragmentBubble(bubble);
            const totalFragmentArea = fragments.reduce((sum, f) => {
                return sum + Math.PI * f.radius * f.radius;
            }, 0);
            
            expect(totalFragmentArea).toBeCloseTo(originalArea, 1);
        });
        
        test('fragments should have outward velocities', () => {
            const bubble = new Bubble(100, 100, 80);
            bubble.vx = 0;
            bubble.vy = 0;
            
            const fragments = Physics.fragmentBubble(bubble);
            
            fragments.forEach(f => {
                const speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
                expect(speed).toBeGreaterThan(0);
            });
        });
    });
    
    describe('Plateau Border Detection', () => {
        test('should detect hexagonal packing with 6 neighbors', () => {
            const center = new Bubble(200, 200, 45);
            const neighbors = [];
            
            // Create 6 neighbors in hexagonal pattern
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * 2 * Math.PI;
                const x = 200 + Math.cos(angle) * 90;
                const y = 200 + Math.sin(angle) * 90;
                neighbors.push(new Bubble(x, y, 45));
            }
            
            const junction = Physics.detectTripleJunction(center, neighbors);
            
            expect(junction.isJunction).toBe(true);
            expect(junction.neighborCount).toBe(6);
            expect(junction.compliance).toBeGreaterThan(0.8);
        });
        
        test('should not detect junction with random neighbors', () => {
            const center = new Bubble(200, 200, 45);
            const neighbors = [
                new Bubble(250, 210, 45),
                new Bubble(190, 260, 45),
                new Bubble(140, 180, 45)
            ];
            
            const junction = Physics.detectTripleJunction(center, neighbors);
            
            expect(junction.isJunction).toBe(false);
        });
    });
});
```

### 2.2 Bubble Class Tests

**File**: `tests/bubble.test.js`

```javascript
import { Bubble } from '../src/modules/bubble.js';

describe('Bubble Class', () => {
    
    describe('Constructor', () => {
        test('should create bubble with given position and radius', () => {
            const bubble = new Bubble(100, 150, 50);
            
            expect(bubble.x).toBe(100);
            expect(bubble.y).toBe(150);
            expect(bubble.radius).toBe(50);
        });
        
        test('should initialize velocity to zero', () => {
            const bubble = new Bubble(100, 150, 50);
            
            expect(bubble.vx).toBe(0);
            expect(bubble.vy).toBe(0);
        });
        
        test('should calculate mass from area', () => {
            const bubble = new Bubble(100, 150, 50);
            const expectedMass = Math.PI * 50 * 50;
            
            expect(bubble.mass).toBeCloseTo(expectedMass, 1);
        });
    });
    
    describe('Update Method', () => {
        test('should update position based on velocity', () => {
            const bubble = new Bubble(100, 100, 50);
            bubble.vx = 2;
            bubble.vy = 3;
            
            bubble.update(1);
            
            expect(bubble.x).toBeCloseTo(102, 1);
            expect(bubble.y).toBeCloseTo(103, 1);
        });
        
        test('should apply gravity', () => {
            const bubble = new Bubble(100, 100, 50);
            const initialVy = bubble.vy;
            
            bubble.update(1);
            
            expect(bubble.vy).toBeGreaterThan(initialVy);
        });
        
        test('should apply damping to velocity', () => {
            const bubble = new Bubble(100, 100, 50);
            bubble.vx = 10;
            bubble.vy = 10;
            
            bubble.update(1);
            
            expect(Math.abs(bubble.vx)).toBeLessThan(10);
            expect(Math.abs(bubble.vy)).toBeLessThan(10);
        });
    });
    
    describe('Force Application', () => {
        test('should apply force correctly', () => {
            const bubble = new Bubble(100, 100, 50);
            const force = 100;
            
            bubble.applyForce(force, 0);
            bubble.update(1);
            
            expect(bubble.vx).toBeGreaterThan(0);
        });
    });
    
    describe('Collision Detection', () => {
        test('should detect collision with overlapping bubble', () => {
            const b1 = new Bubble(100, 100, 50);
            const b2 = new Bubble(120, 100, 50);
            
            expect(b1.isCollidingWith(b2)).toBe(true);
        });
        
        test('should not detect collision with distant bubble', () => {
            const b1 = new Bubble(100, 100, 50);
            const b2 = new Bubble(300, 100, 50);
            
            expect(b1.isCollidingWith(b2)).toBe(false);
        });
    });
});
```

### 2.3 Utilities Tests

**File**: `tests/utils.test.js`

```javascript
import { Utils } from '../src/modules/utils.js';

describe('Utility Functions', () => {
    
    test('distance should calculate correct Euclidean distance', () => {
        const dist = Utils.distance(0, 0, 3, 4);
        expect(dist).toBe(5);
    });
    
    test('normalizeAngle should keep angle in [-π, π]', () => {
        expect(Utils.normalizeAngle(0)).toBe(0);
        expect(Utils.normalizeAngle(Math.PI)).toBe(Math.PI);
        expect(Utils.normalizeAngle(-Math.PI)).toBe(-Math.PI);
        expect(Utils.normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI, 5);
        expect(Utils.normalizeAngle(-3 * Math.PI)).toBeCloseTo(-Math.PI, 5);
    });
    
    test('clamp should constrain value to range', () => {
        expect(Utils.clamp(5, 0, 10)).toBe(5);
        expect(Utils.clamp(-5, 0, 10)).toBe(0);
        expect(Utils.clamp(15, 0, 10)).toBe(10);
    });
    
    test('lerp should interpolate correctly', () => {
        expect(Utils.lerp(0, 10, 0)).toBe(0);
        expect(Utils.lerp(0, 10, 1)).toBe(10);
        expect(Utils.lerp(0, 10, 0.5)).toBe(5);
    });
});
```

### 2.4 Running Unit Tests

**Command**:
```bash
npm test
```

**Coverage Report**:
```bash
npm run test:coverage
```

**Watch Mode** (for development):
```bash
npm run test:watch
```

**Expected Output**:
```
PASS  tests/physics.test.js
PASS  tests/bubble.test.js
PASS  tests/utils.test.js

Test Suites: 3 passed, 3 total
Tests:       28 passed, 28 total
Snapshots:   0 total
Time:        2.156 s
Coverage:    82.4%
```

---

## 3. Integration Testing Procedures

### 3.1 Module Integration Tests

**File**: `tests/integration.test.js`

```javascript
describe('Module Integration', () => {
    
    test('Physics and Bubble modules work together', () => {
        const b1 = new Bubble(100, 100, 50);
        const b2 = new Bubble(120, 100, 50);
        const bubbles = [b1, b2];
        
        // Apply physics
        Physics.detectCollisions(bubbles);
        
        // Check separation occurred
        const distAfter = Utils.distance(b1.x, b1.y, b2.x, b2.y);
        expect(distAfter).toBeGreaterThan(100); // Should separate
    });
    
    test('Renderer can draw bubbles from Physics', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        
        const renderer = new Renderer(canvas);
        const bubble = new Bubble(400, 300, 50);
        
        expect(() => {
            renderer.renderBubble(bubble, [], {});
        }).not.toThrow();
    });
    
    test('Controls module updates physics parameters', () => {
        const controls = new Controls();
        controls.setValue('surfaceTension', 0.05);
        
        expect(Physics.getSurfaceTension()).toBe(0.05);
    });
});
```

### 3.2 End-to-End Workflow Tests

```javascript
describe('Complete Workflows', () => {
    
    test('Add bubble → Collision → Merge workflow', async () => {
        // Setup
        const app = new Application();
        await app.init();
        
        // Add two overlapping bubbles
        app.addBubble(100, 100, 50);
        app.addBubble(120, 100, 50);
        
        // Run simulation steps
        for (let i = 0; i < 100; i++) {
            app.update();
        }
        
        // Check if coalescence occurred (if enabled)
        expect(app.bubbles.length).toBeLessThanOrEqual(2);
    });
    
    test('Compress → Honeycomb formation workflow', async () => {
        const app = new Application();
        await app.init();
        
        // Add 20 bubbles
        for (let i = 0; i < 20; i++) {
            app.addBubble(
                Math.random() * 600 + 100,
                Math.random() * 400 + 100,
                45
            );
        }
        
        // Compress
        app.compress();
        
        // Run simulation
        for (let i = 0; i < 200; i++) {
            app.update();
        }
        
        // Check for hexagonal patterns (at least some bubbles should have 6 neighbors)
        let hexCount = 0;
        for (let bubble of app.bubbles) {
            const junction = Physics.detectTripleJunction(bubble, app.bubbles);
            if (junction.neighborCount === 6) hexCount++;
        }
        
        expect(hexCount).toBeGreaterThan(0);
    });
});
```

---

## 4. Visual Regression Testing

### 4.1 Setup Playwright

**Install**:
```bash
npm install --save-dev @playwright/test
```

**Configuration**: `playwright.config.js`
```javascript
module.exports = {
    testDir: './tests/visual',
    use: {
        baseURL: 'http://localhost:8080',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure'
    },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
        { name: 'firefox', use: { browserName: 'firefox' } },
        { name: 'webkit', use: { browserName: 'webkit' } }
    ]
};
```

### 4.2 Visual Test Scenarios

**File**: `tests/visual/snapshots.test.js`

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Visual Regression Tests', () => {
    
    test('Initial state - 8 bubbles', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(1000); // Let animation settle
        
        await expect(page).toHaveScreenshot('initial-state.png');
    });
    
    test('Honeycomb formation', async ({ page }) => {
        await page.goto('/');
        
        // Add many bubbles
        for (let i = 0; i < 30; i++) {
            await page.click('#addBtn');
        }
        
        // Compress
        await page.click('#compressBtn');
        await page.waitForTimeout(3000);
        
        await expect(page).toHaveScreenshot('honeycomb.png', {
            maxDiffPixels: 100 // Allow minor differences
        });
    });
    
    test('Bubble burst effect', async ({ page }) => {
        await page.goto('/');
        
        // Set low burst threshold
        await page.evaluate(() => {
            window.PHYSICS_CONSTANTS.BURST_PRESSURE_THRESHOLD = 1.1;
        });
        
        // Add and compress
        for (let i = 0; i < 20; i++) {
            await page.click('#addBtn');
        }
        await page.click('#compressBtn');
        await page.click('#compressBtn');
        
        await page.waitForTimeout(2000);
        
        await expect(page).toHaveScreenshot('burst.png', {
            maxDiffPixels: 200
        });
    });
    
    test('Plateau borders visible', async ({ page }) => {
        await page.goto('/');
        
        // Enable Plateau border visualization
        await page.click('[data-toggle="plateauBorders"]');
        
        // Create compressed state
        for (let i = 0; i < 30; i++) {
            await page.click('#addBtn');
        }
        await page.click('#compressBtn');
        await page.waitForTimeout(2000);
        
        await expect(page).toHaveScreenshot('plateau-borders.png');
    });
    
    test('Parameter control UI', async ({ page }) => {
        await page.goto('/');
        
        // Hover over control
        await page.hover('[data-control="surfaceTension"]');
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('controls-hover.png');
    });
});
```

### 4.3 Running Visual Tests

**Generate baseline screenshots**:
```bash
npm run test:visual -- --update-snapshots
```

**Run visual tests**:
```bash
npm run test:visual
```

**Review differences**:
- Failed tests generate diff images in `test-results/`
- Review and approve or fix issues

---

## 5. Performance Testing Procedures

### 5.1 Performance Benchmark Suite

**File**: `tests/performance/benchmarks.js`

```javascript
class PerformanceBenchmark {
    
    /**
     * Measure FPS with given bubble count
     */
    async measureFPS(bubbleCount, duration = 5000) {
        const app = new Application();
        await app.init();
        
        // Add bubbles
        for (let i = 0; i < bubbleCount; i++) {
            app.addBubble(
                Math.random() * 700 + 50,
                Math.random() * 500 + 50,
                45 * (0.7 + Math.random() * 0.6)
            );
        }
        
        // Measure
        let frameCount = 0;
        const startTime = performance.now();
        
        while (performance.now() - startTime < duration) {
            app.update();
            frameCount++;
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
        
        const elapsed = performance.now() - startTime;
        const fps = (frameCount / elapsed) * 1000;
        
        return {
            bubbleCount,
            fps: Math.round(fps),
            frameCount,
            duration: elapsed
        };
    }
    
    /**
     * Measure memory usage
     */
    async measureMemory(bubbleCount) {
        if (!performance.memory) {
            return { error: 'Memory API not available' };
        }
        
        const app = new Application();
        await app.init();
        
        const beforeMem = performance.memory.usedJSHeapSize;
        
        // Add bubbles
        for (let i = 0; i < bubbleCount; i++) {
            app.addBubble(
                Math.random() * 700 + 50,
                Math.random() * 500 + 50,
                45
            );
        }
        
        const afterMem = performance.memory.usedJSHeapSize;
        const memoryUsed = (afterMem - beforeMem) / 1024 / 1024; // MB
        
        return {
            bubbleCount,
            memoryUsedMB: Math.round(memoryUsed * 100) / 100
        };
    }
    
    /**
     * Measure physics update time
     */
    measurePhysicsTime(bubbleCount) {
        const bubbles = [];
        for (let i = 0; i < bubbleCount; i++) {
            bubbles.push(new Bubble(
                Math.random() * 700 + 50,
                Math.random() * 500 + 50,
                45
            ));
        }
        
        const iterations = 100;
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            Physics.detectCollisions(bubbles);
        }
        
        const elapsed = performance.now() - startTime;
        const avgTime = elapsed / iterations;
        
        return {
            bubbleCount,
            avgPhysicsTime: Math.round(avgTime * 100) / 100
        };
    }
    
    /**
     * Run all benchmarks
     */
    async runAll() {
        console.log('Running performance benchmarks...\n');
        
        const results = {
            fps: [],
            memory: [],
            physics: []
        };
        
        // FPS benchmarks
        for (let count of [100, 500, 1000]) {
            console.log(`Measuring FPS with ${count} bubbles...`);
            results.fps.push(await this.measureFPS(count));
        }
        
        // Memory benchmarks
        for (let count of [100, 500, 1000]) {
            console.log(`Measuring memory with ${count} bubbles...`);
            results.memory.push(await this.measureMemory(count));
        }
        
        // Physics benchmarks
        for (let count of [100, 500, 1000]) {
            console.log(`Measuring physics time with ${count} bubbles...`);
            results.physics.push(this.measurePhysicsTime(count));
        }
        
        return results;
    }
    
    /**
     * Generate report
     */
    generateReport(results) {
        console.log('\n=== Performance Benchmark Report ===\n');
        
        console.log('FPS:');
        results.fps.forEach(r => {
            const status = r.fps >= 60 ? '✓' : r.fps >= 30 ? '⚠' : '✗';
            console.log(`  ${status} ${r.bubbleCount} bubbles: ${r.fps} FPS`);
        });
        
        console.log('\nMemory:');
        results.memory.forEach(r => {
            const status = r.memoryUsedMB < 150 ? '✓' : '⚠';
            console.log(`  ${status} ${r.bubbleCount} bubbles: ${r.memoryUsedMB} MB`);
        });
        
        console.log('\nPhysics Update Time:');
        results.physics.forEach(r => {
            const status = r.avgPhysicsTime < 16 ? '✓' : '⚠';
            console.log(`  ${status} ${r.bubbleCount} bubbles: ${r.avgPhysicsTime} ms`);
        });
        
        console.log('\n====================================\n');
    }
}
```

### 5.2 Running Performance Tests

**Command**:
```bash
npm run test:performance
```

**Expected Output**:
```
=== Performance Benchmark Report ===

FPS:
  ✓ 100 bubbles: 60 FPS
  ✓ 500 bubbles: 58 FPS
  ⚠ 1000 bubbles: 42 FPS

Memory:
  ✓ 100 bubbles: 12.5 MB
  ✓ 500 bubbles: 58.2 MB
  ✓ 1000 bubbles: 112.8 MB

Physics Update Time:
  ✓ 100 bubbles: 2.3 ms
  ✓ 500 bubbles: 8.7 ms
  ⚠ 1000 bubbles: 19.2 ms

====================================
```

### 5.3 Performance Regression Detection

Add to CI pipeline:
```yaml
- name: Run performance tests
  run: npm run test:performance
  
- name: Check performance thresholds
  run: |
    # Fail if FPS < 30 for 1000 bubbles
    # Fail if memory > 200MB for 1000 bubbles
```

---

## 6. Browser Compatibility Testing

### 6.1 Manual Testing Checklist

**Test Matrix**:

| Feature | Chrome | Firefox | Safari | Edge | Notes |
|---------|--------|---------|--------|------|-------|
| Canvas rendering | ⬜ | ⬜ | ⬜ | ⬜ | |
| ES6 modules | ⬜ | ⬜ | ⬜ | ⬜ | |
| Mouse interactions | ⬜ | ⬜ | ⬜ | ⬜ | |
| Parameter controls | ⬜ | ⬜ | ⬜ | ⬜ | |
| Animation smoothness | ⬜ | ⬜ | ⬜ | ⬜ | |
| Button functionality | ⬜ | ⬜ | ⬜ | ⬜ | |
| Performance (500 bubbles) | ⬜ | ⬜ | ⬜ | ⬜ | |
| Responsive layout | ⬜ | ⬜ | ⬜ | ⬜ | |

**Testing Procedure**:
1. Open application in each browser
2. Test each feature systematically
3. Record FPS with 500 bubbles
4. Note any visual differences
5. Check console for errors
6. Document issues in GitHub

### 6.2 Automated Cross-Browser Tests

**Using Playwright** (already configured for 3 browsers):
```bash
npm run test:visual -- --project=chromium
npm run test:visual -- --project=firefox
npm run test:visual -- --project=webkit
```

### 6.3 Known Browser Differences

**Safari**:
- May have slightly different Canvas rendering
- Performance.memory not available
- Test on macOS/iOS

**Firefox**:
- Different font rendering
- Slightly different color handling

**Edge**:
- Same engine as Chrome (Chromium)
- Should have identical behavior

---

## 7. User Acceptance Testing (UAT)

### 7.1 UAT Test Scenarios

**Scenario 1: First-Time User Experience**
```
Objective: New user can understand and use the simulation
Steps:
1. Open application (no prior knowledge)
2. Observe initial state
3. Click "Add Bubble" button
4. Observe bubble added
5. Click "Compress" button
6. Observe honeycomb formation
7. Try adjusting parameters (if discoverable)

Success Criteria:
- User understands what the simulation shows
- User can add bubbles without instructions
- Honeycomb pattern is clearly visible
- Controls are intuitive or have helpful tooltips
```

**Scenario 2: Educational Use**
```
Objective: Student learns about Plateau's laws
Steps:
1. Open application
2. Enable info panel (if available)
3. Add 30-40 bubbles
4. Compress multiple times
5. Observe hexagonal patterns
6. Note triple junction angles
7. Adjust surface tension
8. Observe changes in deformation

Success Criteria:
- Student can identify hexagonal patterns
- 120° angles are visible/highlighted
- Surface tension changes are noticeable
- Educational content is clear
```

**Scenario 3: Parameter Exploration**
```
Objective: User explores different physics parameters
Steps:
1. Hover over parameter controls
2. Adjust surface tension (low → high)
3. Observe deformation changes
4. Adjust burst threshold
5. Create burst scenario
6. Observe fragmentation
7. Reset parameters

Success Criteria:
- Parameter controls are discoverable
- Changes are immediate and visible
- Reset works correctly
- System remains stable
```

**Scenario 4: Performance Stress Test**
```
Objective: Simulation handles many bubbles
Steps:
1. Click "Add Bubble" 50+ times rapidly
2. Observe performance
3. Click "Compress"
4. Observe stability
5. Check FPS counter

Success Criteria:
- No crashes or freezes
- FPS remains > 30
- All bubbles render correctly
- Controls remain responsive
```

### 7.2 UAT Feedback Form

**Questions for Testers**:
1. How intuitive was the interface? (1-5)
2. Could you understand what was happening? (Y/N)
3. Did you notice the honeycomb pattern? (Y/N)
4. Were the controls easy to use? (1-5)
5. Did you experience any bugs? (Describe)
6. What would you improve?
7. Overall satisfaction (1-5)

---

## 8. Test Automation Setup

### 8.1 Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:visual": "playwright test",
    "test:visual:update": "playwright test --update-snapshots",
    "test:performance": "node tests/performance/run-benchmarks.js",
    "test:all": "npm run test && npm run test:visual && npm run test:performance",
    "test:ci": "npm run test:coverage && npm run test:visual"
  }
}
```

### 8.2 GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: ['**']
  pull_request:
    branches: [develop, main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:visual
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: visual-test-results
          path: test-results/
          
  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:performance
```

---

## 9. Bug Tracking & Reporting

### 9.1 Bug Report Template

```markdown
## Bug Report

**Title**: [Short description]

**Severity**: Critical / High / Medium / Low

**Browser**: Chrome 90 / Firefox 88 / Safari 14 / Edge 90

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**:


**Actual Behavior**:


**Screenshots**:
[Attach if applicable]

**Console Errors**:
```
[Paste any errors]
```

**Additional Context**:

```

### 9.2 Bug Priority Levels

| Priority | Description | Response Time |
|----------|-------------|---------------|
| **P0 - Critical** | Crashes, data loss, unusable | Immediate |
| **P1 - High** | Major feature broken | 1 day |
| **P2 - Medium** | Minor feature broken | 3 days |
| **P3 - Low** | Cosmetic issue | 1 week |

### 9.3 Bug Workflow

```
New → Triaged → In Progress → Fixed → Verified → Closed
                     ↓
                  Won't Fix
```

---

## 10. Test Data & Scenarios

### 10.1 Standard Test Configurations

**Config 1: Default State**
```javascript
{
    bubbleCount: 8,
    surfaceTension: 0.025,
    gravity: 0.05,
    burstThreshold: 1.5
}
```

**Config 2: High Compression**
```javascript
{
    bubbleCount: 50,
    surfaceTension: 0.025,
    gravity: 0.05,
    burstThreshold: 1.5,
    action: 'compress'
}
```

**Config 3: Low Surface Tension**
```javascript
{
    bubbleCount: 20,
    surfaceTension: 0.015,
    gravity: 0.05,
    burstThreshold: 1.5
}
```

**Config 4: Burst Scenario**
```javascript
{
    bubbleCount: 30,
    surfaceTension: 0.025,
    gravity: 0.05,
    burstThreshold: 1.1,
    action: 'compress'
}
```

### 10.2 Edge Cases to Test

1. **Zero bubbles**: Empty canvas
2. **Single bubble**: No interactions
3. **Maximum bubbles**: 2000 bubbles
4. **All same size**: No variation
5. **Extreme size variation**: 10x difference
6. **All touching**: Maximum compression
7. **Very high surface tension**: Minimal deformation
8. **Very low burst threshold**: Rapid fragmentation

---

## 11. Continuous Integration Checklist

### 11.1 CI Pipeline Requirements

✅ **Before Merge to Develop**:
- [ ] All unit tests pass
- [ ] Test coverage > 80%
- [ ] No console errors
- [ ] Visual tests pass (or differences approved)
- [ ] Performance benchmarks meet thresholds

✅ **Before Merge to Main**:
- [ ] All tests pass
- [ ] Manual testing on 4 browsers completed
- [ ] Documentation updated
- [ ] No known critical bugs
- [ ] Performance tests pass

✅ **After Deployment**:
- [ ] Smoke test on live site
- [ ] Check analytics/errors
- [ ] Verify all features work

---

## 12. Test Maintenance

### 12.1 Regular Test Reviews

**Weekly**:
- Review failed tests
- Update flaky tests
- Check coverage gaps

**Monthly**:
- Review test performance
- Update visual baselines if needed
- Refactor slow tests

**Per Release**:
- Full regression test
- Update test documentation
- Archive old test results

### 12.2 Test Hygiene

**Best Practices**:
- Tests should be independent
- Use descriptive test names
- Clean up after tests
- Avoid hardcoded timeouts
- Mock external dependencies
- Keep tests fast (< 1s per unit test)

---

## Summary

**Total Test Coverage**:
- **Unit Tests**: 28+ tests across 3 modules
- **Integration Tests**: 5 workflows
- **Visual Tests**: 5 scenarios
- **Performance Tests**: 3 benchmark suites
- **Browser Tests**: 8 features × 4 browsers = 32 checks
- **UAT Scenarios**: 4 complete workflows

**Estimated Testing Time**:
- Unit tests: 3 seconds
- Visual tests: 2 minutes
- Performance tests: 2 minutes
- Browser testing: 30 minutes (manual)
- UAT: 1 hour

**CI Pipeline Duration**: ~5 minutes

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Status**: Awaiting Approval  
**Next Document**: GitHub Versioning & Branching Strategy