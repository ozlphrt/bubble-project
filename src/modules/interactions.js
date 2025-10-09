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
    this.controlPanelVisible = true; // Start visible
    this.autoHideEnabled = true; // Auto-hide enabled by default
    this.hideTimeout = null;
    this.initialAutoHideScheduled = false; // Track if initial auto-hide has been scheduled
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

    document.getElementById('restart')?.addEventListener('click', () => {
      this.simulation.restart();
    });

    document.getElementById('reset')?.addEventListener('click', () => {
      this.simulation.resetToDefaults();
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
      
      // Handle control panel visibility for mobile auto-hide
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const syntheticEvent = {
          clientX: touch.clientX,
          clientY: touch.clientY
        };
        this.handleControlsVisibility(syntheticEvent);
      }
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault(); // Prevent scrolling
      this.handleTouchEnd(e);
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    // Preset button events with highlighting
    const presetButtons = [
      { id: 'preset-honeycomb', name: 'honeycomb' },
      { id: 'preset-pebbles', name: 'pebbles' },
      { id: 'preset-bouncy-foam', name: 'bouncy-foam' },
      { id: 'preset-tight-pack', name: 'tight-pack' },
      { id: 'preset-soap', name: 'soap' },
      { id: 'preset-pearls', name: 'pearls' }
    ];
    
    presetButtons.forEach(preset => {
      document.getElementById(preset.id)?.addEventListener('click', (e) => {
        this.simulation.applyPreset(preset.name);
        
        // Highlight selected preset button
        presetButtons.forEach(p => {
          const btn = document.getElementById(p.id);
          if (btn) {
            btn.style.background = 'rgba(255, 255, 255, 0.1)';
            btn.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            btn.style.boxShadow = 'none';
          }
        });
        e.target.style.background = 'rgba(100,200,255,0.3)';
        e.target.style.border = '2px solid rgba(100,200,255,0.8)';
        e.target.style.boxShadow = '0 0 10px rgba(100,200,255,0.4)';
      });
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
    
    // Pin toggle button event listener - use event delegation
    document.addEventListener('click', (e) => {
      // Check if clicked element or its parent is the pin button
      const pinBtn = e.target.closest('#pinToggleBtn');
      if (pinBtn) {
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
    const presetPanel = document.querySelector('.preset-buttons');
    
    let isOverControl = false;
    let isOverPreset = false;
    
    // Check control panel
    if (controlPanel) {
      const panelRect = controlPanel.getBoundingClientRect();
      isOverControl = e.clientX >= panelRect.left && 
                     e.clientX <= panelRect.right && 
                     e.clientY >= panelRect.top && 
                     e.clientY <= panelRect.bottom;
    }
    
    // Check presets panel
    if (presetPanel) {
      const panelRect = presetPanel.getBoundingClientRect();
      isOverPreset = e.clientX >= panelRect.left && 
                    e.clientX <= panelRect.right && 
                    e.clientY >= panelRect.top && 
                    e.clientY <= panelRect.bottom;
    }
    
    const isOver = isOverControl || isOverPreset;
    
    // If mouse/touch is over either panel, ensure they're visible and clear any hide timeout
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
    
    // Check if mouse/touch is near right edge (within 50px) - always show panel
    const nearRightEdge = pos.x >= window.innerWidth - 50;
    
    if (nearLeftEdge || nearRightEdge) {
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
    const presetButtons = document.querySelector('.preset-buttons');
    
    if (controlPanel && !this.controlPanelVisible) {
      controlPanel.classList.remove('hidden');
      this.controlPanelVisible = true;
    }
    
    // Also show preset buttons
    if (presetButtons) {
      presetButtons.classList.remove('hidden');
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
    }, 2000); // Hide after 2 seconds of no mouse movement
  }

  /**
   * Hide control panel (sliders only)
   */
  hideControlPanel() {
    const controlPanel = document.querySelector('.control-panel');
    const presetButtons = document.querySelector('.preset-buttons');
    
    if (controlPanel && this.controlPanelVisible) {
      controlPanel.classList.add('hidden');
      this.controlPanelVisible = false;
    }
    
    // Also hide preset buttons
    if (presetButtons) {
      presetButtons.classList.add('hidden');
    }
    
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * Schedule initial auto-hide after simulation starts
   */
  scheduleInitialAutoHide() {
    if (!this.initialAutoHideScheduled && this.autoHideEnabled) {
      this.initialAutoHideScheduled = true;
      setTimeout(() => {
        if (this.autoHideEnabled && this.controlPanelVisible) {
          this.hideControlPanel();
        }
      }, 3000); // Hide after 3 seconds
    }
  }

  /**
   * Update pin icon to show current state
   */
  updatePinIcon() {
    const pinIcon = document.getElementById('pinIcon');
    if (pinIcon) {
      if (!this.autoHideEnabled) {
        // Pinned (auto-hide disabled) - solid pin
        pinIcon.style.color = 'rgba(255,255,255,1)';
        pinIcon.textContent = '📍';
      } else {
        // Unpinned (auto-hide enabled) - round pin
        pinIcon.style.color = 'rgba(255,255,255,0.7)';
        pinIcon.textContent = '📌';
      }
    }
  }

  /**
   * Initialize pin button after control panel is created
   */
  initializePinButton() {
    const pinBtn = document.getElementById('pinToggleBtn');
    if (pinBtn) {
      // Add direct event listener as backup
      pinBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.autoHideEnabled = !this.autoHideEnabled;
        this.updatePinIcon();
        if (!this.autoHideEnabled) {
          this.showControlPanel();
        }
      });
      // Update initial state
      this.updatePinIcon();
    }
  }

  /**
   * Initialize color palette button event listeners
   */
  initializePaletteButtons() {
    const paletteButtons = document.querySelectorAll('.color-palette-btn');
    
    paletteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const paletteId = button.getAttribute('data-palette');
        this.applyColorPalette(paletteId);
        
        // Visual feedback - highlight selected palette
        paletteButtons.forEach(btn => {
          btn.style.border = '1px solid rgba(255,255,255,0.2)';
          btn.style.background = 'rgba(255,255,255,0.1)';
        });
        button.style.border = '2px solid rgba(100,200,255,0.8)';
        button.style.background = 'rgba(100,200,255,0.2)';
      });
      
      // Hover effect
      button.addEventListener('mouseenter', () => {
        if (button.style.border !== '2px solid rgba(100,200,255,0.8)') {
          button.style.background = 'rgba(255,255,255,0.2)';
        }
      });
      
      button.addEventListener('mouseleave', () => {
        if (button.style.border !== '2px solid rgba(100,200,255,0.8)') {
          button.style.background = 'rgba(255,255,255,0.1)';
        }
      });
    });
    
    // Highlight the default palette (blues)
    const defaultPalette = document.querySelector('.color-palette-btn[data-palette="blues"]');
    if (defaultPalette) {
      defaultPalette.style.border = '2px solid rgba(100,200,255,0.8)';
      defaultPalette.style.background = 'rgba(100,200,255,0.2)';
    }
  }

  /**
   * Apply a color palette to all bubbles
   */
  applyColorPalette(paletteId) {
    // Import Bubble class to update static palette
    import('./bubble.js').then(module => {
      const Bubble = module.Bubble;
      Bubble.currentPalette = paletteId;
      
      // Recolor all existing bubbles
      if (this.simulation && this.simulation.bubbles) {
        this.simulation.bubbles.forEach(bubble => {
          bubble.color = bubble.generateColor(0);
        });
      }
    });
  }

  /**
   * Show palette selection submenu
   */
  showPaletteSubmenu(faucetMenu, faucetBtn) {
    const palettes = [
      { name: 'Blues', id: 'blues' },
      { name: 'Spectrum', id: 'spectrum' },
      { name: 'Neon', id: 'neon' },
      { name: 'Sunset', id: 'sunset' },
      { name: 'Ocean', id: 'ocean' },
      { name: 'Rainbow', id: 'rainbow' },
      { name: 'Mono', id: 'mono' },
      { name: 'Fire', id: 'fire' }
    ];

    // Create submenu HTML
    let submenuHTML = '<div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">';
    submenuHTML += '<div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-bottom: 6px;">Choose Palette:</div>';
    
    palettes.forEach(palette => {
      submenuHTML += `<button class="palette-option" data-palette="${palette.id}" style="width: 100%; padding: 4px 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 3px; color: white; cursor: pointer; font-size: 11px; margin-bottom: 3px; text-align: left;">${palette.name}</button>`;
    });
    
    submenuHTML += '</div>';

    // Replace or add submenu content
    const existingSubmenu = faucetMenu.querySelector('.palette-submenu');
    if (existingSubmenu) {
      existingSubmenu.remove();
    }
    
    faucetMenu.insertAdjacentHTML('beforeend', submenuHTML);

    // Add event listeners to palette options
    faucetMenu.querySelectorAll('.palette-option').forEach(button => {
      button.addEventListener('click', (e) => {
        const paletteId = e.target.getAttribute('data-palette');
        
        this.simulation.physics.spawnColorMode = 'palette';
        this.simulation.physics.spawnPaletteMode = paletteId;
        
        // Update faucet button to show palette colors
        import('./bubble.js').then(module => {
          const colors = module.Bubble.getPaletteColors(paletteId);
          const color1 = colors[0] || 'rgb(255,0,0)';
          faucetBtn.style.background = `linear-gradient(135deg, ${color1}, rgba(255,255,255,0.2))`;
        });
        
        // Close menu
        faucetMenu.style.display = 'none';
      });
    });
  }

  /**
   * Initialize faucet button and spawn color options
   */
  initializeFaucetButton() {
    const faucetBtn = document.getElementById('faucetBtn');
    const faucetMenu = document.getElementById('faucetMenu');
    const colorPicker = document.getElementById('bubbleColorPicker');
    
    if (faucetBtn && faucetMenu) {
      // Toggle dropdown menu on faucet button click
      faucetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = faucetMenu.style.display === 'block';
        faucetMenu.style.display = isVisible ? 'none' : 'block';
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!faucetMenu.contains(e.target) && e.target !== faucetBtn) {
          faucetMenu.style.display = 'none';
          // Also remove any submenu
          const existingSubmenu = faucetMenu.querySelector('.palette-submenu');
          if (existingSubmenu) {
            existingSubmenu.remove();
          }
        }
      });
      
      // Option 1: Custom Color
      document.getElementById('spawnOption-custom')?.addEventListener('click', () => {
        faucetMenu.style.display = 'none';
        colorPicker.click();
      });
      
      // Option 2: Different Palette (show palette submenu)
      document.getElementById('spawnOption-palette')?.addEventListener('click', () => {
        this.showPaletteSubmenu(faucetMenu, faucetBtn);
      });
      
      // Option 3: Current Palette
      document.getElementById('spawnOption-current')?.addEventListener('click', () => {
        faucetMenu.style.display = 'none';
        this.simulation.physics.spawnColorMode = 'current';
        delete this.simulation.physics.customSpawnColor;
        delete this.simulation.physics.spawnPaletteMode;
        faucetBtn.style.background = 'rgba(100,200,255,0.3)';
      });
      
      // Color picker change handler
      if (colorPicker) {
        colorPicker.addEventListener('change', (e) => {
          const hexColor = e.target.value;
          // Convert hex to rgb format
          const r = parseInt(hexColor.slice(1, 3), 16);
          const g = parseInt(hexColor.slice(3, 5), 16);
          const b = parseInt(hexColor.slice(5, 7), 16);
          const rgbColor = `rgb(${r}, ${g}, ${b})`;
          
          // Store chosen color for spawn
          if (this.simulation && this.simulation.physics) {
            this.simulation.physics.spawnColorMode = 'custom';
            this.simulation.physics.customSpawnColor = rgbColor;
          }
          
          // Visual feedback - change faucet button background
          faucetBtn.style.background = `linear-gradient(135deg, ${hexColor}, rgba(255,255,255,0.2))`;
        });
      }
    }
  }

}