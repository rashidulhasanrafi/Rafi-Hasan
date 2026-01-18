
let audioContext: AudioContext | null = null;

export const playSound = (type: 'income' | 'expense' | 'click' | 'delete' | 'toggle') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    // Reuse the audio context to avoid hitting browser limits (max 6 contexts usually)
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    // Resume context if it's suspended (common browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    const ctx = audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'income':
        // Cheerful "Coin" sound - High pitch sine wave
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, now);
        oscillator.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
        break;

      case 'expense':
        // "Swish" / "Thud" sound - Lower pitch triangle wave
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.linearRampToValueAtTime(100, now + 0.15);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        break;

      case 'click':
        // Subtle tick - Very short high pitch
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.01, now); 
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        oscillator.start(now);
        oscillator.stop(now + 0.03);
        break;
        
      case 'delete':
         // Descending tone
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.linearRampToValueAtTime(50, now + 0.15);
        gainNode.gain.setValueAtTime(0.03, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        break;

      case 'toggle':
        // Sharp blip
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, now);
        gainNode.gain.setValueAtTime(0.02, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;
    }
  } catch (e) {
    console.error("Audio play failed", e);
  }
};
