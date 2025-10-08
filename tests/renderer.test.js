/**
 * Unit tests for Renderer module
 */

import { Renderer } from '../src/modules/renderer.js';
import { Bubble } from '../src/modules/bubble.js';

describe('Renderer Module', () => {
  let renderer;
  let mockCanvas;
  let mockCtx;
  
  beforeEach(() => {
    mockCtx = {
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      arc: jest.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      save: jest.fn(),
      restore: jest.fn(),
      fillText: jest.fn()
    };
    
    mockCanvas = {
      width: 800,
      height: 600,
      getContext: jest.fn(() => mockCtx)
    };
    
    renderer = new Renderer(mockCanvas);
  });
  
  test('should create renderer with canvas context', () => {
    expect(renderer.canvas).toBe(mockCanvas);
    expect(renderer.ctx).toBe(mockCtx);
    expect(renderer.performanceMode).toBe(false);
  });
  
  test('should clear canvas', () => {
    renderer.clear();
    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
  });
  
  test('should find contacts between bubbles', () => {
    const bubble1 = new Bubble(100, 100, 50);
    const bubble2 = new Bubble(120, 100, 30); // Close enough
    const bubble3 = new Bubble(300, 300, 30); // Too far
    const allBubbles = [bubble1, bubble2, bubble3];
    
    const contacts = renderer.findContacts(bubble1, allBubbles);
    expect(contacts).toContain(bubble2);
    expect(contacts).not.toContain(bubble3);
  });
  
  test('should render bubbles', () => {
    const bubble = new Bubble(100, 100, 50);
    const bubbles = [bubble];
    
    // Mock the bubble's draw method
    bubble.draw = jest.fn();
    
    renderer.renderBubbles(bubbles);
    
    expect(bubble.draw).toHaveBeenCalledWith(mockCtx, []);
  });
  
  test('should render UI stats', () => {
    const stats = {
      fps: 60,
      bubbleCount: 5,
      updateTime: 2.5
    };
    
    renderer.renderUI(stats);
    
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
    expect(mockCtx.fillText).toHaveBeenCalledWith('FPS: 60', 10, 20);
    expect(mockCtx.fillText).toHaveBeenCalledWith('Bubbles: 5', 10, 40);
    expect(mockCtx.fillText).toHaveBeenCalledWith('Update: 2.5ms', 10, 60);
  });
  
  test('should set performance mode', () => {
    renderer.setPerformanceMode(true);
    expect(renderer.performanceMode).toBe(true);
    
    renderer.setPerformanceMode(false);
    expect(renderer.performanceMode).toBe(false);
  });
  
  test('should add alpha to HSL colors', () => {
    const color = 'hsl(120, 50%, 50%)';
    const result = renderer.addAlpha(color, 0.5);
    expect(result).toBe('hsla(120, 50%, 50%, 0.5)');
  });
  
  test('should handle empty bubble arrays', () => {
    expect(() => {
      renderer.renderBubbles([]);
    }).not.toThrow();
  });
});

