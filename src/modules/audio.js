/**
 * Audio Module
 * 
 * This module handles all audio generation and playback for the simulation,
 * including coalescence sounds, collision sounds, and ambient audio.
 * 
 * @fileoverview Audio system for bubble simulation
 * @version 1.0.0
 */

/**
 * AudioManager class for managing all simulation sounds
 */
export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.enabled = false;
    this.volume = 0.3; // Default volume (0-1)
    
    this.init();
  }
  
  /**
   * Initialize Web Audio API
   */
  init() {
    try {
      // Create audio context (user gesture required for autoplay)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create master gain node for volume control
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);
      
      this.enabled = true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.enabled = false;
    }
  }
  
  /**
   * Resume audio context (required after user interaction)
   */
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
  
  /**
   * Set master volume
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }
  
  /**
   * Play coalescence sound based on current preset and bubble characteristics
   * @param {number} size1 - Radius of first bubble
   * @param {number} size2 - Radius of second bubble
   * @param {number} resultSize - Radius of merged bubble
   * @param {string} currentPreset - Current active preset ('honeycomb', 'pebbles', 'tight-pack', 'soap')
   */
  playCoalescenceSound(size1, size2, resultSize, currentPreset = 'default') {
    if (!this.enabled || !this.audioContext) return;
    
    this.resume();
    
    const now = this.audioContext.currentTime;
    
    // Play preset-specific sounds
    switch (currentPreset) {
      case 'honeycomb':
        // Bubble wrap pop sound
        this.playBubbleWrapSound(resultSize, now);
        break;
        
      case 'pebbles':
        // Pebble click sound
        this.playPebbleClickSound(resultSize, now);
        break;
        
      case 'tight-pack': // Rubber Balls
        // Duffled, bassy, rubbery sound
        this.playRubberBallSound(resultSize, now);
        break;
        
      case 'soap':
        // Very short pop-up sound
        this.playSoapPopSound(resultSize, now);
        break;
        
      case 'rubber-pearls':
        // Billiard balls sound
        this.playBilliardSound(resultSize, now);
        break;
        
      default:
        // Fallback to size-based sound
        const isLargeBubble = resultSize > 30;
        if (isLargeBubble) {
          this.playLargeBubbleSound(resultSize, now);
        } else {
          this.playSmallBubbleSound(resultSize, now);
        }
        break;
    }
  }
  
  /**
   * Play deep bass sound for large bubble merges (rubber balls)
   */
  playLargeBubbleSound(resultSize, now) {
    // Create a low frequency oscillator for bass
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    
    // Very low frequency for rubber ball feeling
    const baseFrequency = 120 + (60 - resultSize) * 3;
    const frequency = Math.max(60, Math.min(200, baseFrequency));
    
    oscillator.frequency.setValueAtTime(frequency * 2, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency, now + 0.08);
    
    // Add sub-bass for weight
    const subOsc = this.audioContext.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(frequency * 0.5, now);
    
    const subGain = this.audioContext.createGain();
    subGain.gain.setValueAtTime(0.3, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    // Main gain envelope
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.6, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    
    // Low-pass filter for warmth
    const lowpass = this.audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(400, now);
    lowpass.Q.value = 2;
    
    // Connect nodes
    oscillator.connect(lowpass);
    lowpass.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.15);
    
    subOsc.start(now);
    subOsc.stop(now + 0.15);
  }
  
  /**
   * Play bubble wrap pop sound for honeycomb preset
   */
  playBubbleWrapSound(resultSize, now) {
    // Create a short, sharp pop with slight metallic ring
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'square';
    
    // Higher frequency for the "pop" character
    const baseFrequency = 800 + (200 - resultSize) * 5;
    const frequency = Math.max(400, Math.min(1200, baseFrequency));
    
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.3, now + 0.08);
    
    // Sharp envelope for pop
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    
    // Add slight metallic resonance
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency * 1.5, now);
    filter.Q.value = 3;
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.08);
  }
  
  /**
   * Play pebble click sound for pebbles preset
   */
  playPebbleClickSound(resultSize, now) {
    // Create a sharp, dry click like pebbles hitting
    const bufferSize = this.audioContext.sampleRate * 0.02; // 20ms buffer
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate a sharp click with slight low-end emphasis
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.audioContext.sampleRate;
      const decay = Math.exp(-t * 100); // Very fast decay
      const click = (Math.random() * 2 - 1) * decay;
      data[i] = click;
    }
    
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = buffer;
    
    // High-pass filter for sharp click
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(1200, now);
    highpass.Q.value = 1;
    
    // Low-pass filter to add slight warmth
    const lowpass = this.audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(3000, now);
    lowpass.Q.value = 0.5;
    
    noiseSource.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(this.masterGain);
    
    noiseSource.start(now);
  }
  
  /**
   * Play rubber ball sound for tight-pack preset
   */
  playRubberBallSound(resultSize, now) {
    // Create a duffled, bassy, rubbery sound
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    
    // Lower frequency for rubbery feel
    const baseFrequency = 80 + (40 - resultSize) * 2;
    const frequency = Math.max(60, Math.min(150, baseFrequency));
    
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.4, now + 0.15);
    
    // Duffled envelope
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    // Heavy low-pass filter for muffled sound
    const lowpass = this.audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(200, now);
    lowpass.Q.value = 1;
    
    oscillator.connect(lowpass);
    lowpass.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }
  
  /**
   * Play soap pop sound for soap preset
   */
  playSoapPopSound(resultSize, now) {
    // Create a very short, crisp pop
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    
    // High frequency for crisp pop
    const baseFrequency = 1000 + (300 - resultSize) * 8;
    const frequency = Math.max(600, Math.min(1500, baseFrequency));
    
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.2, now + 0.03);
    
    // Very short envelope
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.025);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.03);
  }
  
  /**
   * Play billiard ball sound for rubber pearls preset
   */
  playBilliardSound(resultSize, now) {
    // Create a solid, resonant "clack" like billiard balls
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    
    // Mid-range frequency for solid clack
    const baseFrequency = 400 + (100 - resultSize) * 3;
    const frequency = Math.max(200, Math.min(800, baseFrequency));
    
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.6, now + 0.1);
    
    // Solid envelope with slight sustain
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.005);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    // Band-pass filter for resonant clack
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency, now);
    filter.Q.value = 2;
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  /**
   * Play crisp click for small/medium bubbles (fallback)
   */
  playSmallBubbleSound(resultSize, now) {
    // Create noise burst for click sound
    const bufferSize = this.audioContext.sampleRate * 0.05; // 50ms buffer
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate white noise burst with exponential decay
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.audioContext.sampleRate;
      const decay = Math.exp(-t * 80); // Very fast decay for click
      data[i] = (Math.random() * 2 - 1) * decay;
    }
    
    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = buffer;
    
    // Create a highpass filter for crisp click
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(600, now); // Lower for soap bubbles
    highpass.Q.value = 2;
    
    // Create bandpass for tone shaping
    const bandpass = this.audioContext.createBiquadFilter();
    bandpass.type = 'bandpass';
    
    // Lower frequency range for more realistic soap bubble pop
    const baseFrequency = 1200 + (35 - resultSize) * 25;
    const frequency = Math.max(400, Math.min(2500, baseFrequency));
    
    bandpass.frequency.setValueAtTime(frequency, now);
    bandpass.Q.value = 4; // Narrow band for tonal click
    
    // Gain node for volume control
    const gainNode = this.audioContext.createGain();
    
    // Very sharp attack and decay for burst effect
    const peakVolume = 0.4;
    gainNode.gain.setValueAtTime(peakVolume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    // Connect: noise -> highpass -> bandpass -> gain -> master
    noiseSource.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Play the burst
    noiseSource.start(now);
    noiseSource.stop(now + 0.05);
  }
  
  /**
   * Toggle audio on/off
   */
  toggle() {
    this.enabled = !this.enabled;
    
    if (!this.enabled && this.audioContext) {
      this.audioContext.suspend();
    } else if (this.enabled && this.audioContext) {
      this.audioContext.resume();
    }
    
    return this.enabled;
  }
  
  /**
   * Check if audio is enabled
   */
  isEnabled() {
    return this.enabled;
  }
}

