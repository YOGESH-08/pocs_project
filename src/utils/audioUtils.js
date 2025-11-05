// Audio utility: file load, waveform extract, and fake DSP processing

export function getWaveformFromAudioBuffer(buffer) {
  // mono
  if(buffer.numberOfChannels < 1) return [];
  const data = buffer.getChannelData(0);
  return Array.from(data);
}
export function applySimpleNoiseSuppression(waveform) {
  // Just attenuate as a placeholder for DSP
  return waveform.map(x => x*0.7 + (Math.random()-0.5)*0.1);
}
export function audioBufferToWavBlob(buffer) {
  // mono only, float32 to WAV PCM16
  const encodeWAV = (samples, sampleRate) => {
    const buffer2 = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer2);
    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    }
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    // PCM conversion
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([view], { type: 'audio/wav' });
  };
  return encodeWAV(buffer.getChannelData(0), buffer.sampleRate);
}
// Provide a blob URL for playback
export function wavBufferToUrl(buffer) {
  const blob = audioBufferToWavBlob(buffer);
  return URL.createObjectURL(blob);
}
