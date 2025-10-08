/**
 * Controls Module
 * 
 * This module handles interactive controls for adjusting physics parameters
 * in real-time through sliders and UI elements.
 * 
 * @fileoverview Interactive controls for soap bubble simulation
 * @version 1.0.0
 * @author Soap Bubble Simulation Team
 */

/**
 * Controls class for managing interactive parameter adjustments
 */
export class Controls {
  constructor() {
    this.controls = {
      // Collision & Separation
      targetDist: {
        label: 'Separation',
        tooltip: 'How close bubbles can get to each other. Lower values = tighter packing.',
        value: 0.83,
        min: 0.01, // Allow extreme packing
        max: 1.1,
        step: 0.01, // Larger step for easier adjustment
        default: 0.83
      },
      separation: {
        label: 'Separation Force',
        tooltip: 'How strongly bubbles push each other apart. Higher = more repulsion.',
        value: 0.30,
        min: 0.01, // Minimum 0.01 for very soft separation
        max: 1.0,
        step: 0.01,
        default: 0.30
      },
      collisionStrength: {
        label: 'Collision Strength',
        tooltip: 'How bouncy bubbles are when they collide. Higher = more bounce.',
        value: 0.03,
        min: 0.001,
        max: 0.1,
        step: 0.001,
        default: 0.03
      },
      
      // Bubble Properties
      influenceThreshold: {
        label: 'Morphing Threshold',
        tooltip: 'How close bubbles need to be to start deforming each other.',
        value: 0.1,
        min: 0.01,
        max: 0.5,
        step: 0.01,
        default: 0.1
      },
      deformationStrength: {
        label: 'Morphing Strength',
        tooltip: 'How much bubbles can deform when squished together.',
        value: 1.54,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        default: 1.54
      },
      wallBounce: {
        label: 'Wall Bounce',
        tooltip: 'How much energy bubbles keep when bouncing off walls.',
        value: 0.45,
        min: 0.1,
        max: 0.9,
        step: 0.01,
        default: 0.45
      },
      damping: {
        label: 'Damping',
        tooltip: 'How quickly bubbles slow down. Higher = more friction.',
        value: 0.99,
        min: 0.98,
        max: 0.999,
        step: 0.001,
        default: 0.99
      },
      
      // Force Parameters
      compressionForce: {
        label: 'Compression Force',
        tooltip: 'How much force is applied when you press the Compress button.',
        value: 0.06, // Updated default compression force
        min: 0.001,
        max: 0.1,
        step: 0.001,
        default: 0.06
      },
      interpolationFactor: {
        label: 'Force Smoothing',
        tooltip: 'How smoothly forces are applied. Higher = smoother but slower response.',
        value: 0.03,
        min: 0.01,
        max: 0.2,
        step: 0.01,
        default: 0.03
      },
      
      
      
      
      // Gravity Control
      gravity: {
        label: 'Gravity',
        tooltip: 'How strongly bubbles are pulled downward.',
        value: 0.04, // Updated default gravity
        min: 0,
        max: 0.5,
        step: 0.01,
        default: 0.04
      },
      
      // Surface Tension Control
      surfaceTension: {
        label: 'Surface Tension',
        tooltip: 'How much bubbles try to maintain their round shape.',
        value: 0.03, // Updated surface tension default
        min: 0,
        max: 3.0, // Increased max to 3
        step: 0.01,
        default: 0.03
      },
      
      // Coalescence Rate Control
      coalescenceRate: {
        label: 'Coalescence Rate',
        tooltip: 'How often bubbles merge together. Higher = more merging.',
        value: 0.00001, // Very low default - realistic slow merging
        min: 0.0,
        max: 0.001, // Max 0.1% chance per frame per pair
        step: 0.00001,
        default: 0.00001
      },
      
      // Plateau Force Strength
      plateauForceStrength: {
        label: 'Plateau Force',
        tooltip: 'Force that pushes bubble junctions toward 120° angles (honeycomb effect).',
        value: 0.2,
        min: 0,
        max: 0.3, // Increased max
        step: 0.01,
        default: 0.2
      },
      
      // Bubble Size Controls
      averageSize: {
        label: 'Average Size',
        tooltip: 'Base size of bubbles. 1.0 = normal size.',
        value: 1.0, // Base size multiplier
        min: 0.3,
        max: 2.0,
        step: 0.1,
        default: 1.0
      },
      
      sizeVariation: {
        label: 'Size Variation',
        tooltip: 'How much bubble sizes vary. 0 = all same size, 1 = full variation.',
        value: 0.8, // How much size varies (0 = all same size, 1 = full variation)
        min: 0.0,
        max: 1.0,
        step: 0.01, // Smaller step to allow reaching exactly 0.0
        default: 0.8
      },
      
      // Bubble Count Control
      bubbleCount: {
        label: 'Bubble Count',
        tooltip: 'Total number of bubbles in the simulation.',
        value: 300, // Default number of bubbles
        min: 10,
        max: 1000,
        step: 10,
        default: 300
      }
    };
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse events for slider interaction
    document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    
    // Touch events for slider interaction
    document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    
    // Toggle checkbox events
    document.addEventListener('change', (e) => {
      if (e.target && e.target.id && e.target.id.startsWith('toggle-')) {
        const key = e.target.id.replace('toggle-', '');
        if (this.controls[key]) {
          this.setValue(key, e.target.checked ? 1 : 0);
        }
      }
    });
    
    // Double-click to restore default values
    document.addEventListener('dblclick', (e) => {
      if (e.target && e.target.id && e.target.id.startsWith('slider-track-')) {
        const key = e.target.id.replace('slider-track-', '');
        const control = this.controls[key];
        if (control && control.default !== undefined) {
          this.setValue(key, control.default);
        }
      }
    });
    
    this.isDragging = false;
    this.draggedControl = null;
  }

  handleMouseDown(e) {
    // Prevent text selection when clicking on sliders
    if (e.target && (e.target.id?.startsWith('slider-') || e.target.parentElement?.style?.position === 'relative')) {
      e.preventDefault();
    }
    
    // Check if click is on a slider track or handle
    const control = this.getControlAtPosition(e.clientX, e.clientY);
    if (control) {
      e.preventDefault(); // Prevent text selection
      this.isDragging = true;
      this.draggedControl = control;
      this.updateControlValue(control, e.clientX, e.clientY);
      
      // Show value display for this control
      const valueDisplay = document.getElementById(`value-${control.key}`);
      if (valueDisplay) {
        valueDisplay.style.opacity = '1';
      }
    }
  }

  handleMouseMove(e) {
    if (this.isDragging && this.draggedControl) {
      this.updateControlValue(this.draggedControl, e.clientX, e.clientY);
      
    }
  }

  handleMouseUp(e) {
    // Hide value display for the dragged control
    if (this.draggedControl) {
      const valueDisplay = document.getElementById(`value-${this.draggedControl.key}`);
      if (valueDisplay) {
        valueDisplay.style.opacity = '0';
      }
    }
    
    this.isDragging = false;
    this.draggedControl = null;
  }

  handleTouchStart(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const control = this.getControlAtPosition(touch.clientX, touch.clientY);
      if (control) {
        this.isDragging = true;
        this.draggedControl = control;
        this.updateControlValue(control, touch.clientX, touch.clientY);
        
        // Show value display for this control
        const valueDisplay = document.getElementById(`value-${control.key}`);
        if (valueDisplay) {
          valueDisplay.style.opacity = '1';
        }
      }
    }
  }

  handleTouchMove(e) {
    if (e.touches.length === 1 && this.isDragging && this.draggedControl) {
      const touch = e.touches[0];
      this.updateControlValue(this.draggedControl, touch.clientX, touch.clientY);
    }
  }

  handleTouchEnd(e) {
    // Hide value display for the dragged control
    if (this.draggedControl) {
      const valueDisplay = document.getElementById(`value-${this.draggedControl.key}`);
      if (valueDisplay) {
        valueDisplay.style.opacity = '0';
      }
    }
    
    this.isDragging = false;
    this.draggedControl = null;
  }

  getControlAtPosition(mouseX, mouseY) {
    // Check if mouse is over the control panel
    const controlPanel = document.getElementById('controlPanel');
    if (!controlPanel) return null;
    
    const panelRect = controlPanel.getBoundingClientRect();
    if (mouseX < panelRect.left || mouseX > panelRect.right || 
        mouseY < panelRect.top || mouseY > panelRect.bottom) {
      return null;
    }
    
    // Find which slider the mouse is over by checking the slider TRACK
    for (const [key, control] of Object.entries(this.controls)) {
      // Skip toggle controls
      if (control.isToggle) continue;
      
      const sliderTrack = document.getElementById(`slider-track-${key}`);
      if (sliderTrack) {
        const trackRect = sliderTrack.getBoundingClientRect();
        
        // Check if mouse is anywhere on the slider track (full width)
        if (mouseX >= trackRect.left && mouseX <= trackRect.right &&
            mouseY >= trackRect.top && mouseY <= trackRect.bottom) {
          return { key, control };
        }
      }
    }
    
    return null;
  }

  updateControlValue(controlInfo, mouseX, mouseY) {
    const { key, control } = controlInfo;
    
    // Find the slider track element for this control
    const sliderTrack = document.getElementById(`slider-track-${key}`);
    if (!sliderTrack) return;
    
    const trackRect = sliderTrack.getBoundingClientRect();
    
    // Calculate position within the slider track
    const relativeX = mouseX - trackRect.left;
    const percentage = Math.max(0, Math.min(1, relativeX / trackRect.width));
    
    // Calculate new value based on percentage
    const newValue = control.min + percentage * (control.max - control.min);
    
    // Update the control value
    this.setValue(key, newValue);
  }

  getValue(key) {
    return this.controls[key]?.value || 0;
  }

  setValue(key, value) {
    if (this.controls[key]) {
      const oldValue = this.controls[key].value;
      this.controls[key].value = Math.max(
        this.controls[key].min,
        Math.min(this.controls[key].max, value)
      );
      
      // Debug logging for sizeVariation
      if (key === 'sizeVariation') {
        console.log(`setValue called for sizeVariation: ${oldValue} -> ${this.controls[key].value}`);
      }
      
      // Trigger callback if defined
      if (this.controls[key].onChange) {
        this.controls[key].onChange(this.controls[key].value);
      }
    }
  }

  getAllValues() {
    const values = {};
    for (const [key, control] of Object.entries(this.controls)) {
      values[key] = control.value;
    }
    return values;
  }

  resetToDefaults() {
    // Reset all controls to their default values
    for (const [key, control] of Object.entries(this.controls)) {
      if (control.default !== undefined) {
        control.value = control.default;
      }
    }
  }
}