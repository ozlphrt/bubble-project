/**
 * Unit tests for Physics module
 */

import { Physics, PHYSICS_CONSTANTS } from '../src/modules/physics.js';
import { Bubble } from '../src/modules/bubble.js';

describe('Physics Module', () => {
  let physics;
  
  beforeEach(() => {
    physics = new Physics();
  });
  
  test('should have correct physics constants', () => {
    expect(PHYSICS_CONSTANTS.SURFACE_TENSION_DEFAULT).toBe(0.025);
    expect(PHYSICS_CONSTANTS.DEFAULT_RADIUS).toBe(45);
    expect(PHYSICS_CONSTANTS.GRAVITY).toBe(0.05);
  });
  
  test('should calculate surface pressure correctly', () => {
    const radius = 50;
    const surfaceTension = 0.025;
    const pressure = physics.calculateSurfacePressure(radius, surfaceTension);
    
    // Young-Laplace: ΔP = γ/r
    const expectedPressure = surfaceTension / radius;
    expect(pressure).toBeCloseTo(expectedPressure, 5);
  });
  
  test('should find contacts between bubbles', () => {
    const bubble1 = new Bubble(100, 100, 50);
    const bubble2 = new Bubble(120, 100, 30); // Close enough to contact
    const bubble3 = new Bubble(300, 300, 30); // Too far
    const allBubbles = [bubble1, bubble2, bubble3];
    
    const contacts = physics.findContacts(bubble1, allBubbles);
    expect(contacts).toContain(bubble2);
    expect(contacts).not.toContain(bubble3);
  });
  
  test('should handle collision detection', () => {
    const bubble1 = new Bubble(100, 100, 50);
    const bubble2 = new Bubble(120, 100, 30);
    const bubbles = [bubble1, bubble2];
    
    // Should not throw
    expect(() => {
      physics.detectCollisions(bubbles);
    }).not.toThrow();
  });
  
  test('should apply physics updates', () => {
    const bubble = new Bubble(100, 100, 50);
    const bubbles = [bubble];
    
    const initialVy = bubble.vy;
    physics.updatePositions(bubbles, 1);
    
    // Should apply gravity
    expect(bubble.vy).toBeGreaterThan(initialVy);
  });
  
  test('should handle empty bubble arrays', () => {
    expect(() => {
      physics.detectCollisions([]);
      physics.updatePositions([], 1);
    }).not.toThrow();
  });
});
