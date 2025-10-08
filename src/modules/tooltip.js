/**
 * Custom tooltip system for control panel sliders
 */
export class TooltipManager {
  constructor() {
    this.tooltipElement = null;
    this.init();
  }

  init() {
    // Get the tooltip element
    this.tooltipElement = document.getElementById('customTooltip');
    
    if (!this.tooltipElement) {
      console.warn('Custom tooltip element not found');
      return;
    }

    // Add event delegation for all elements with data-tooltip
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target && target.hasAttribute('data-tooltip')) {
        this.show(target.getAttribute('data-tooltip'));
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target && target.hasAttribute('data-tooltip')) {
        this.hide();
      }
    });
  }

  show(text) {
    if (!this.tooltipElement || !text) return;
    
    this.tooltipElement.textContent = text;
    this.tooltipElement.classList.add('visible');
  }

  hide() {
    if (!this.tooltipElement) return;
    
    this.tooltipElement.classList.remove('visible');
  }
}

