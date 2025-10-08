/**
 * Unit tests for Bubble class
 */

import { Bubble } from '../src/modules/bubble.js';

describe('Bubble Class', () => {
  let bubble;
  
  beforeEach(() => {
    bubble = new Bubble(100, 100, 50);
  });
  
  test('should create a bubble with correct properties', () => {
    expect(bubble.x).toBe(100);
    expect(bubble.y).toBe(100);
    expect(bubble.radius).toBe(50);
    expect(bubble.vx).toBe(0);
    expect(bubble.vy).toBe(0);
    expect(bubble.age).toBe(0);
    expect(bubble.id).toBeDefined();
  });
  
  test('should generate a valid color', () => {
    expect(bubble.color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });
  
  test('should increment age on update', () => {
    const initialAge = bubble.age;
    const mockCanvas = { width: 800, height: 600 };
    bubble.update(1, mockCanvas);
    expect(bubble.age).toBe(initialAge + 1);
  });
  
  test('should detect collision with another bubble', () => {
    const otherBubble = new Bubble(120, 100, 30);
    expect(bubble.isCollidingWith(otherBubble)).toBe(true);
    
    const distantBubble = new Bubble(300, 300, 30);
    expect(bubble.isCollidingWith(distantBubble)).toBe(false);
  });
  
  test('should have unique IDs', () => {
    const bubble1 = new Bubble(0, 0, 10);
    const bubble2 = new Bubble(0, 0, 10);
    expect(bubble1.id).not.toBe(bubble2.id);
  });
  
  test('should calculate deformed shape correctly', () => {
    const contactBubble = new Bubble(120, 100, 30);
    const shape = bubble.calculateDeformedShape([contactBubble]);
    
    expect(shape).toHaveLength(64); // 64 segments
    expect(shape[0]).toHaveProperty('x');
    expect(shape[0]).toHaveProperty('y');
  });
  
  test('should handle wall bouncing', () => {
    const mockCanvas = { width: 800, height: 600 };
    
    // Position bubble at left edge
    bubble.x = bubble.radius;
    bubble.vx = -5; // Moving left
    
    const initialVx = bubble.vx;
    bubble.update(1, mockCanvas);
    
    // Should bounce and reverse direction
    expect(bubble.vx).toBeGreaterThan(0);
    expect(bubble.x).toBeGreaterThanOrEqual(bubble.radius);
  });
  
  test('should apply damping', () => {
    const mockCanvas = { width: 800, height: 600 };
    bubble.vx = 10;
    bubble.vy = 10;
    
    bubble.update(1, mockCanvas);
    
    // Should be damped
    expect(bubble.vx).toBeLessThan(10);
    expect(bubble.vy).toBeLessThan(10);
  });
});
