// Utilities for noise, signal, and SNR calculations

export function generateWhiteNoise(length = 200, mean = 0, variance = 1) {
  const arr = [];
  for(let i=0;i<length;i++){
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
    arr.push(mean + Math.sqrt(variance) * z0);
  }
  return arr;
}
export function generateShotNoise(length = 200, rate = 2) {
  return Array.from({length}, () => (Math.random()-0.5)*rate);
}
export function generateThermalNoise(length=200, temperature = 300, bandwidth = 1000, resistance=1) {
  // Johnson-Nyquist
  const k = 1.38e-23;
  const variance = 4*k*temperature*bandwidth*resistance;
  return generateWhiteNoise(length, 0, variance);
}
export function generateSineSignal(length=200, amplitude=1, freq=5) {
  return Array.from({length}, (_,i) => amplitude * Math.sin(2 * Math.PI * freq * i / length));
}
export function generateSquareSignal(length=200, amplitude=1, freq=2) {
  return Array.from({length}, (_,i) => Math.sin(2 * Math.PI * freq * i / length) > 0 ? amplitude : -amplitude);
}
export function generateDigitalSignal(length=200) {
  return Array.from({length}, () => Math.random()>0.5 ? 1 : -1);
}
export function calculateSignalPower(signal) {
  return signal.reduce((sum, x) => sum+x*x, 0)/signal.length;
}
export function calculateNoise(signal, noise) {
  return signal.map((n, i) => n - noise[i]);
}
export function calculateSNR(clean, noisy) {
  const signalPower = calculateSignalPower(clean);
  const noisePower = calculateSignalPower(noisy.map((n,i)=>n-clean[i]));
  return 10*Math.log10(signalPower/noisePower);
}
export function addNoise(signal, noise, snrDb) {
  // Scale noise to target SNR
  const signalPower = calculateSignalPower(signal);
  const noisePower = calculateSignalPower(noise);
  const wantedSNR = Math.pow(10, snrDb/10);
  const scale = Math.sqrt(signalPower / (wantedSNR * noisePower));
  const noisy = signal.map((x, i) => x + scale*noise[i]);
  return noisy;
}
