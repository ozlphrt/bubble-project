/**
 * Unit tests for Interactions module
 */

import { Interactions } from '../src/modules/interactions.js';

describe('Interactions Module', () => {
  let interactions;
  let mockCanvas;
  
  beforeEach(() => {
    mockCanvas = {
      addEventListener: jest.fn(),
      getBoundingClientRect: jest.fn(() => ({
        left: 0,
        top: 0
      })),
      dispatchEvent: jest.fn()
    };
    
    interactions = new Interactions(mockCanvas);
  });
  
  test('should create interactions with canvas', () => {
    expect(interactions.canvas).toBe(mockCanvas);
    expect(interactions.mousePosition).toEqual({ x: 0, y: 0 });
    expect(interactions.isDragging).toBe(false);
  });
  
  test('should set up event listeners', () => {
    expect(mockCanvas.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    expect(mockCanvas.addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function));
  });
  
  test('should handle mouse click', () => {
    const mockEvent = {
      clientX: 100,
      clientY: 200
    };
    
    interactions.handleMouseClick(mockEvent);
    
    expect(mockCanvas.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'addBubble',
        detail: { x: 100, y: 200 }
      })
    );
  });
  
  test('should handle mouse down', () => {
    const mockEvent = {
      clientX: 100,
      clientY: 200
    };
    
    interactions.handleMouseDown(mockEvent);
    
    expect(interactions.isDragging).toBe(true);
    expect(interactions.dragStart).toEqual({ x: 100, y: 200 });
  });
  
  test('should handle mouse move', () => {
    const mockEvent = {
      clientX: 150,
      clientY: 250
    };
    
    interactions.handleMouseMove(mockEvent);
    
    expect(interactions.mousePosition).toEqual({ x: 150, y: 250 });
  });
  
  test('should handle mouse up', () => {
    interactions.isDragging = true;
    interactions.handleMouseUp({});
    
    expect(interactions.isDragging).toBe(false);
  });
  
  test('should handle mouse leave', () => {
    interactions.isDragging = true;
    interactions.handleMouseLeave({});
    
    expect(interactions.isDragging).toBe(false);
  });
  
  test('should handle keyboard events', () => {
    const mockEvent = {
      key: ' ',
      preventDefault: jest.fn()
    };
    
    interactions.handleKeyDown(mockEvent);
    
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockCanvas.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'togglePause'
      })
    );
  });
  
  test('should get mouse position', () => {
    interactions.mousePosition = { x: 100, y: 200 };
    const position = interactions.getMousePosition();
    
    expect(position).toEqual({ x: 100, y: 200 });
    expect(position).not.toBe(interactions.mousePosition); // Should be a copy
  });
  
  test('should check if currently dragging', () => {
    expect(interactions.isCurrentlyDragging()).toBe(false);
    
    interactions.isDragging = true;
    expect(interactions.isCurrentlyDragging()).toBe(true);
  });
});

