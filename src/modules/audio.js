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
   * Play coalescence sound - sharp burst click with bass emphasis for larger bubbles
   * @param {number} size1 - Radius of first bubble
   * @param {number} size2 - Radius of second bubble
   * @param {number} resultSize - Radius of merged bubble
   */
  playCoalescenceSound(size1, size2, resultSize) {
    if (!this.enabled || !this.audioContext) return;
    
    this.resume();
    
    const now = this.audioContext.currentTime;
    
    // Determine sound character based on bubble size
    const isLargeBubble = resultSize > 30; // Rubber balls and large soap bubbles
    
    if (isLargeBubble) {
      // LARGE BUBBLES: Deep bass thump for rubber balls
      this.playLargeBubbleSound(resultSize, now);
    } else {
      // SMALL/MEDIUM BUBBLES: Crisp click (original sound, but adjusted)
      this.playSmallBubbleSound(resultSize, now);
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
   * Play crisp click for small/medium bubbles
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

