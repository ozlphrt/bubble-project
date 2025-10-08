/**
 * Interactions Module
 * 
 * This module handles all user interactions including mouse events,
 * keyboard input, and button controls for the simulation.
 * 
 * @fileoverview User interaction handler for soap bubble simulation
 * @version 1.0.0
 * @author Soap Bubble Simulation Team
 */

/**
 * Interactions class for handling user input
 */
export class Interactions {
  constructor(canvas, simulation) {
    this.canvas = canvas;
    this.simulation = simulation;
    this.isDragging = false;
    this.draggedBubble = null;
    this.dragOffset = { x: 0, y: 0 };
    this.controlPanelVisible = true; // Default to visible (auto-hide OFF)
    this.autoHideEnabled = false; // Auto-hide disabled by default
    this.hideTimeout = null;
    this.setupEventListeners();
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Button event listeners
    document.getElementById('compress')?.addEventListener('click', () => {
      this.simulation.compress();
    });

    document.getElementById('reset')?.addEventListener('click', () => {
      this.simulation.reset();
    });


    // Mouse events for drag interactions and bubble creation
    this.canvas.addEventListener('mousedown', (e) => {
      this.handleMouseDown(e);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e);
      // Handle control panel visibility if mouse is not over control panel
      if (!this.isMouseOverControlPanel(e)) {
        this.handleControlsVisibility(e);
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      this.handleMouseUp(e);
    });

    this.canvas.addEventListener('click', (e) => {
      this.handleClick(e);
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.autoHideEnabled) {
        this.hideControlPanel();
      }
    });

    // Touch events for mobile bubble dragging
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent scrolling
      this.handleTouchStart(e);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Prevent scrolling
      this.handleTouchMove(e);
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault(); // Prevent scrolling
      this.handleTouchEnd(e);
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    // Preset button events
    document.getElementById('preset-perfect-honeycomb')?.addEventListener('click', () => {
      this.simulation.applyPreset('perfect-honeycomb');
    });
    document.getElementById('preset-stable-foam')?.addEventListener('click', () => {
      this.simulation.applyPreset('stable-foam');
    });
    document.getElementById('preset-bouncy-foam')?.addEventListener('click', () => {
      this.simulation.applyPreset('bouncy-foam');
    });
    document.getElementById('preset-tight-pack')?.addEventListener('click', () => {
      this.simulation.applyPreset('tight-pack');
    });
    document.getElementById('preset-soap')?.addEventListener('click', () => {
      this.simulation.applyPreset('soap');
    });
    document.getElementById('preset-pearls')?.addEventListener('click', () => {
      this.simulation.applyPreset('pearls');
    });

    // Global mouse move for left edge detection
    document.addEventListener('mousemove', (e) => {
      // Always check for left edge detection
      this.handleControlsVisibility(e);
    });

    // Global touch move for left edge detection
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        // Create a synthetic mouse event for left edge detection
        const syntheticEvent = {
          clientX: touch.clientX,
          clientY: touch.clientY
        };
        this.handleControlsVisibility(syntheticEvent);
      }
    });
    
    // Pin toggle button event listener
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'pinToggleBtn') {
        this.autoHideEnabled = !this.autoHideEnabled;
        this.updatePinIcon();
        if (!this.autoHideEnabled) {
          // If auto-hide is disabled, show the panel and clear any hide timeout
          this.showControlPanel();
        }
      }
    });

    // Control panel event listeners to prevent auto-hide during interaction
    document.addEventListener('mouseenter', (e) => {
      if (e.target && e.target.closest && e.target.closest('.control-panel')) {
        // Mouse entered control panel - show it and clear any hide timeout
        this.showControlPanel();
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
          this.hideTimeout = null;
        }
      }
    });

    document.addEventListener('mouseleave', (e) => {
      if (e.target && e.target.closest && e.target.closest('.control-panel')) {
        // Mouse left control panel - schedule hide if auto-hide is enabled
        if (this.autoHideEnabled) {
          this.scheduleHideControlPanel();
        }
      }
    });
  }

  /**
   * Handle mouse down events
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseDown(e) {
    const pos = this.getMousePosition(e);
    
    // Find bubble at mouse position
    const bubble = this.findBubbleAt(pos.x, pos.y);
    
    if (bubble) {
      this.isDragging = true;
      this.draggedBubble = bubble;
      this.dragOffset.x = pos.x - bubble.x;
      this.dragOffset.y = pos.y - bubble.y;
      
      // Set cursor style
      this.canvas.style.cursor = 'grabbing';
    }
  }

  /**
   * Handle mouse move events
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseMove(e) {
    const pos = this.getMousePosition(e);
    
    if (this.isDragging && this.draggedBubble) {
      // Move the bubble to mouse position
      const targetX = pos.x - this.dragOffset.x;
      const targetY = pos.y - this.dragOffset.y;
      
      // Apply smooth movement with some resistance
      const moveForce = 0.3;
      this.draggedBubble.x += (targetX - this.draggedBubble.x) * moveForce;
      this.draggedBubble.y += (targetY - this.draggedBubble.y) * moveForce;
      
      // Add some velocity for natural movement
      this.draggedBubble.vx = (targetX - this.draggedBubble.x) * 0.1;
      this.draggedBubble.vy = (targetY - this.draggedBubble.y) * 0.1;
    } else {
      // Check for hover effects
      const bubble = this.findBubbleAt(pos.x, pos.y);
      this.canvas.style.cursor = bubble ? 'grab' : 'default';
    }
  }

  /**
   * Handle mouse up events
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseUp(e) {
    if (this.isDragging && this.draggedBubble) {
      // Release the bubble with some momentum
      const pos = this.getMousePosition(e);
      const targetX = pos.x - this.dragOffset.x;
      const targetY = pos.y - this.dragOffset.y;
      
      // Give the bubble some velocity based on drag speed
      this.draggedBubble.vx = (targetX - this.draggedBubble.x) * 0.2;
      this.draggedBubble.vy = (targetY - this.draggedBubble.y) * 0.2;
      
      // Reset drag state
      this.isDragging = false;
      this.draggedBubble = null;
      this.dragOffset = { x: 0, y: 0 };
      
      // Reset cursor
      this.canvas.style.cursor = 'default';
    }
  }

  /**
   * Handle click events
   * @param {MouseEvent} e - Mouse event
   */
  handleClick(e) {
    // Only add bubble if we weren't dragging
    if (!this.isDragging) {
      const pos = this.getMousePosition(e);
      this.simulation.addBubble(pos.x, pos.y);
    }
  }

  /**
   * Handle touch start events
   * @param {TouchEvent} e - Touch event
   */
  handleTouchStart(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const pos = this.getTouchPosition(touch);
      
      // Find bubble at touch position
      const bubble = this.findBubbleAt(pos.x, pos.y);
      if (bubble) {
        this.isDragging = true;
        this.draggedBubble = bubble;
        this.dragOffset = {
          x: pos.x - bubble.x,
          y: pos.y - bubble.y
        };
        this.canvas.style.cursor = 'grabbing';
      }
    }
  }

  /**
   * Handle touch move events
   * @param {TouchEvent} e - Touch event
   */
  handleTouchMove(e) {
    if (e.touches.length === 1 && this.isDragging && this.draggedBubble) {
      const touch = e.touches[0];
      const pos = this.getTouchPosition(touch);
      
      // Update bubble position smoothly
      this.draggedBubble.x = pos.x - this.dragOffset.x;
      this.draggedBubble.y = pos.y - this.dragOffset.y;
      
      // Apply some velocity for natural movement
      const deltaTime = 0.016; // Approximate 60fps
      this.draggedBubble.vx = (pos.x - this.draggedBubble.x) * 0.1;
      this.draggedBubble.vy = (pos.y - this.draggedBubble.y) * 0.1;
    }
  }

  /**
   * Handle touch end events
   * @param {TouchEvent} e - Touch event
   */
  handleTouchEnd(e) {
    if (this.isDragging && this.draggedBubble) {
      // Release the bubble with momentum
      this.draggedBubble = null;
      this.isDragging = false;
      this.dragOffset = { x: 0, y: 0 };
      this.canvas.style.cursor = 'default';
    }
  }

  /**
   * Get touch position relative to canvas
   * @param {Touch} touch - Touch object
   * @returns {Object} Position object with x and y coordinates
   */
  getTouchPosition(touch) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyDown(e) {
    switch(e.key) {
      case ' ':
        e.preventDefault();
        this.simulation.compress();
        break;
      case 'r':
      case 'R':
        this.simulation.reset();
        break;
      case 'd':
      case 'D':
        // Reset controls to defaults
        this.simulation.resetControlsToDefaults();
        break;
      case '1':
        // Perfect honeycomb preset
        this.simulation.applyPreset('perfect-honeycomb');
        break;
      case '2':
        // Stable foam preset
        this.simulation.applyPreset('stable-foam');
        break;
      case '3':
        // Bouncy foam preset
        this.simulation.applyPreset('bouncy-foam');
        break;
      case '4':
        // Tight pack preset
        this.simulation.applyPreset('tight-pack');
        break;
      case '5':
        // Soap preset
        this.simulation.applyPreset('soap');
        break;
      case '6':
        // Rubber Pearls preset
        this.simulation.applyPreset('pearls');
        break;
    }
  }

  /**
   * Get mouse position relative to canvas
   * @param {MouseEvent} e - Mouse event
   * @returns {Object} Object with x and y coordinates
   */
  getMousePosition(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  /**
   * Get position relative to canvas (works for both mouse and touch events)
   * @param {Object} event - Event object with clientX and clientY
   * @returns {Object} Position object with x and y coordinates
   */
  getEventPosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  /**
   * Find bubble at given coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Bubble|null} Bubble at position or null
   */
  findBubbleAt(x, y) {
    // Check bubbles in reverse order (top to bottom)
    for (let i = this.simulation.bubbles.length - 1; i >= 0; i--) {
      const bubble = this.simulation.bubbles[i];
      const dx = x - bubble.x;
      const dy = y - bubble.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= bubble.radius) {
        return bubble;
      }
    }
    return null;
  }

  /**
   * Check if mouse is over the control panel
   * @param {MouseEvent} e - Mouse event
   * @returns {boolean} True if mouse is over control panel
   */
  isMouseOverControlPanel(e) {
    const controlPanel = document.querySelector('.control-panel');
    if (!controlPanel) return false;
    
    const panelRect = controlPanel.getBoundingClientRect();
    const isOver = e.clientX >= panelRect.left && 
                   e.clientX <= panelRect.right && 
                   e.clientY >= panelRect.top && 
                   e.clientY <= panelRect.bottom;
    
    // If mouse is over panel, ensure it's visible and clear any hide timeout
    if (isOver && this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    
    return isOver;
  }

  /**
   * Handle control panel visibility based on mouse position
   * @param {MouseEvent} e - Mouse event
   */
  handleControlsVisibility(e) {
    const pos = this.getEventPosition(e);
    
    // Check if mouse/touch is near left edge (within 50px) - always show panel
    const nearLeftEdge = pos.x <= 50;
    
    if (nearLeftEdge) {
      this.showControlPanel();
    } else if (this.autoHideEnabled && !this.isMouseOverControlPanel(e)) {
      // Only schedule hide if auto-hide is enabled and mouse is not over panel
      this.scheduleHideControlPanel();
    }
  }

  /**
   * Show control panel (sliders only)
   */
  showControlPanel() {
    const controlPanel = document.querySelector('.control-panel');
    if (controlPanel && !this.controlPanelVisible) {
      controlPanel.classList.remove('hidden');
      this.controlPanelVisible = true;
    }
    
    // Clear any pending hide timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * Schedule hiding control panel after a delay
   */
  scheduleHideControlPanel() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    
    this.hideTimeout = setTimeout(() => {
      this.hideControlPanel();
    }, 3000); // Hide after 3 seconds of no mouse movement
  }

  /**
   * Hide control panel (sliders only)
   */
  hideControlPanel() {
    const controlPanel = document.querySelector('.control-panel');
    if (controlPanel && this.controlPanelVisible) {
      controlPanel.classList.add('hidden');
      this.controlPanelVisible = false;
    }
    
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * Update pin icon to show current state
   */
  updatePinIcon() {
    const pinIcon = document.getElementById('pinIcon');
    if (pinIcon) {
      if (!this.autoHideEnabled) {
        // Pinned (auto-hide disabled) - bright pin
        pinIcon.style.color = 'rgba(255,255,255,1)';
        pinIcon.textContent = '📌';
      } else {
        // Unpinned (auto-hide enabled) - dim pin
        pinIcon.style.color = 'rgba(255,255,255,0.5)';
        pinIcon.textContent = '📌';
      }
    }
  }

}