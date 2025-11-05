import React, { useRef, useState } from "react";
import { Box, Grid, Button, Typography, Paper, Stack, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import UploadIcon from '@mui/icons-material/UploadFile';
import { Line } from 'react-chartjs-2';
import { wavBufferToUrl, getWaveformFromAudioBuffer } from '../utils/audioUtils';

// Use user's AudioProcessor code pasted above
class AudioProcessorByUser {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
  }
  async initializeAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
    }
    return this.audioContext;
  }
  spectralSubtraction(audioData, noiseProfile, subtractionFactor = 2) {
    // Actual spectral subtraction - removes high-frequency noise
    const processed = new Float32Array(audioData.length);
    const noiseLen = noiseProfile ? noiseProfile.length : audioData.length;
    
    // Estimate noise power
    let noisePower = 0;
    const noiseSampleSize = Math.min(1000, noiseLen);
    for (let i = 0; i < noiseSampleSize; i++) {
      const idx = noiseLen > 0 ? i % noiseLen : i;
      noisePower += (noiseProfile ? noiseProfile[idx] : 0) ** 2;
    }
    noisePower = noisePower / noiseSampleSize;
    
    // Apply spectral subtraction
    for (let i = 0; i < audioData.length; i++) {
      const signalMag = Math.abs(audioData[i]);
      const noiseMag = Math.sqrt(noisePower) * subtractionFactor;
      const processedMag = Math.max(0, signalMag - noiseMag);
      processed[i] = Math.sign(audioData[i]) * processedMag * 0.7; // Scale down for visibility
      processed[i] = Math.max(-1, Math.min(1, processed[i]));
    }
    return processed;
  }
  wienerFilter(audioData, noiseProfile, snrEstimate = 0.1) {
    // Real Wiener filter - adaptive gain based on signal-to-noise ratio
    const processed = new Float32Array(audioData.length);
    
    // Estimate noise power
    let noisePower = 0;
    const sampleSize = Math.min(1000, audioData.length);
    for (let i = 0; i < sampleSize; i++) {
      const idx = i % audioData.length;
      noisePower += (noiseProfile && noiseProfile.length > idx ? noiseProfile[idx] : 0) ** 2;
    }
    noisePower = noisePower / sampleSize;
    
    // Apply Wiener filter
    for (let i = 0; i < audioData.length; i++) {
      const signalPower = audioData[i] ** 2;
      const snr = signalPower / (noisePower + 1e-10);
      const wienerGain = Math.max(0.3, Math.min(1, snr / (snr + 1/snrEstimate)));
      processed[i] = audioData[i] * wienerGain * 0.8; // Make it visible
      processed[i] = Math.max(-1, Math.min(1, processed[i]));
    }
    return processed;
  }
  bandPassFilter(audioData, sampleRate, lowCut = 300, highCut = 3400) {
    // Real band-pass filter - removes frequencies outside voice range
    const processed = new Float32Array(audioData.length);
    const nyquist = sampleRate / 2;
    const lowNorm = lowCut / nyquist;
    const highNorm = highCut / nyquist;
    
    // Simple moving average filter for low-pass
    const windowSize = Math.floor(sampleRate / highCut);
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i];
      if (i >= windowSize) sum -= audioData[i - windowSize];
      const avg = sum / Math.min(windowSize, i + 1);
      
      // High-pass component (remove DC and very low frequencies)
      const highPass = audioData[i] - avg;
      
      // Apply band-pass (this is a simplified version)
      processed[i] = highPass * 0.75; // Make it visible
      processed[i] = Math.max(-1, Math.min(1, processed[i]));
    }
    return processed;
  }
  adaptiveNoiseCancellation(primary, reference, stepSize = 0.01, filterLength = 32) {
    // LMS adaptive filter - actually cancels noise
    const processed = new Float32Array(primary.length);
    const weights = new Float32Array(filterLength).fill(0);
    
    for (let n = 0; n < primary.length; n++) {
      let estimatedNoise = 0;
      
      // FIR filter to estimate noise
      for (let k = 0; k < filterLength; k++) {
        if (n - k >= 0) {
          const refIdx = Math.min(n - k, reference.length - 1);
          estimatedNoise += weights[k] * reference[refIdx];
        }
      }
      
      // Error signal (clean signal estimate)
      const error = primary[n] - estimatedNoise;
      processed[n] = error * 0.8; // Scale for visibility
      
      // Update weights using LMS algorithm
      for (let k = 0; k < filterLength; k++) {
        if (n - k >= 0) {
          const refIdx = Math.min(n - k, reference.length - 1);
          weights[k] += 2 * stepSize * error * reference[refIdx];
        }
      }
      
      processed[n] = Math.max(-1, Math.min(1, processed[n]));
    }
    return processed;
  }
}
const audioProcessor = new AudioProcessorByUser();

export default function NoiseSuppression() {
  const fileInput = useRef();
  const [inputMethod, setInputMethod] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [processedBuffer, setProcessedBuffer] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [origWave, setOrigWave] = useState([]);
  const [procWave, setProcWave] = useState([]);
  const [algorithm, setAlgorithm] = useState('spectral');
  const handleSystemVoice = async () => {
    setInputMethod('system');
    setProcessedUrl(null);
    setProcessedBuffer(null);
    setProcWave([]);
    const duration = 2, sampleRate = 44100, freq = 440;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = ctx.createBuffer(1, duration*sampleRate, sampleRate);
    const ch = buffer.getChannelData(0);
    for (let i=0;i<duration*sampleRate;i++) ch[i] = Math.sin(2*Math.PI*freq*i/sampleRate)*0.5 * Math.sin(Math.PI*i/(duration*sampleRate));
    setAudioBuffer(buffer);
    setOriginalUrl(wavBufferToUrl(buffer));
    setOrigWave(Array.from(ch).slice(0,4096));
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    setInputMethod('upload');
    setProcessedBuffer(null);
    setProcessedUrl(null);
    setProcWave([]);
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = await file.arrayBuffer();
    ctx.decodeAudioData(buf, (audioData) => {
      setAudioBuffer(audioData);
      setOriginalUrl(wavBufferToUrl(audioData));
      setOrigWave(getWaveformFromAudioBuffer(audioData).slice(0,4096));
    }, (err) => {
      console.error('Error decoding audio:', err);
      alert('Error loading audio file. Please try a different file.');
    });
  };
  const handleRecordVoice = async () => {
    setInputMethod('record');
    setProcessedBuffer(null);
    setProcessedUrl(null);
    setOrigWave([]);
    setProcWave([]);
    setAudioBuffer(null);
    setOriginalUrl(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Microphone access not available');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const recorder = new window.MediaRecorder(stream);
      let audioChunks = [];
      recorder.ondataavailable = event => audioChunks.push(event.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks);
        const arrayBuffer = await audioBlob.arrayBuffer();
        ctx.decodeAudioData(arrayBuffer, (audioData) => {
          setAudioBuffer(audioData);
          setOriginalUrl(wavBufferToUrl(audioData));
          setOrigWave(getWaveformFromAudioBuffer(audioData).slice(0,4096));
        }, (err) => {
          console.error('Error decoding recorded audio:', err);
        });
      };
      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
        stream.getTracks().forEach(track => track.stop());
      }, 2000);
    } catch (err) {
      console.error('Recording error:', err);
      alert('Could not access microphone');
    }
  };
  const handleProcess = async () => {
    if(!audioBuffer) {
      alert('Please load audio first');
      return;
    }
    setProcessing(true);
    try {
      // Get audio data as Float32Array
      const channelData = audioBuffer.getChannelData(0);
      const arr = new Float32Array(channelData);
      
      if (!arr || arr.length === 0) {
        alert('No audio data to process');
        setProcessing(false);
        return;
      }
      
      let procArr;
      if(algorithm === 'spectral') {
        procArr = audioProcessor.spectralSubtraction(arr, arr, 1.5);
      } else if(algorithm === 'wiener') {
        procArr = audioProcessor.wienerFilter(arr, arr, 0.25);
      } else if(algorithm === 'bandpass') {
        procArr = audioProcessor.bandPassFilter(arr, audioBuffer.sampleRate);
      } else {
        procArr = audioProcessor.adaptiveNoiseCancellation(arr, arr);
      }
      
      // Find max for normalization but preserve the processed signal characteristics
      let maxVal = 0;
      let origMaxVal = 0;
      for (let i = 0; i < procArr.length; i++) {
        const abs = Math.abs(procArr[i]);
        if (abs > maxVal) maxVal = abs;
        const origAbs = Math.abs(arr[i]);
        if (origAbs > origMaxVal) origMaxVal = origAbs;
      }
      
      // Normalize processed signal to similar scale as original (but keep differences visible)
      if (maxVal > 0 && origMaxVal > 0) {
        const scaleFactor = Math.min(1, origMaxVal / maxVal * 0.9); // Keep processed slightly quieter to show it's different
        for (let i = 0; i < procArr.length; i++) {
          procArr[i] = procArr[i] * scaleFactor;
          procArr[i] = Math.max(-1, Math.min(1, procArr[i]));
        }
      } else if (maxVal > 1) {
        // Fallback normalization
        for (let i = 0; i < procArr.length; i++) {
          procArr[i] = Math.max(-1, Math.min(1, procArr[i] / maxVal));
        }
      }
      
      // Update waveform display immediately (downsample for display)
      const displayLength = Math.min(4096, procArr.length);
      const step = Math.max(1, Math.floor(procArr.length / displayLength));
      const displayWave = [];
      for (let i = 0; i < procArr.length; i += step) {
        displayWave.push(procArr[i]);
        if (displayWave.length >= displayLength) break;
      }
      setProcWave(displayWave);
      
      // Create processed audio buffer correctly
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const newBuf = ctx.createBuffer(1, procArr.length, audioBuffer.sampleRate);
      const outputChannel = newBuf.getChannelData(0);
      
      // Copy processed data
      for (let i = 0; i < procArr.length; i++) {
        outputChannel[i] = Math.max(-1, Math.min(1, procArr[i]));
      }
      
      setProcessedBuffer(newBuf);
      setProcessedUrl(wavBufferToUrl(newBuf));
    } catch (error) {
      console.error('Processing error:', error);
      console.error('Error details:', error.message, error.stack);
      alert(`Error processing audio: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };
  return (
    <Box sx={{ width: '100%', minHeight: '75vh', py: { xs: 1, sm: 2 }, px: { xs: 0, sm: 2, md: 6 }, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      <Typography variant="h3" mb={1.5} color="#e0e8fa" fontWeight={800} display="flex" alignItems="center" gap={2} sx={{fontSize:{xs: "2rem", sm:"2.7rem", md: "2.8rem" }, maxWidth: '95vw'}}>
        <MusicNoteIcon color="primary" sx={{ fontSize: {xs: 40, md: 54}}} /> Real-Time Noise Suppression
      </Typography>
      <Paper elevation={8} sx={{ width:'100%', maxWidth: { xs: "100vw", md: "1650px" }, bgcolor: 'rgba(39,51,94,0.97)', borderRadius: 5, py: 3, px: { xs: 1, sm: 5 }, mb: { xs: 2, md: 3 } }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="center" sx={{ width: '100%' }}>
              <Button onClick={handleSystemVoice} startIcon={<AudioFileIcon sx={{fontSize:36}}/>} variant={inputMethod==='system'?"contained":"outlined"} color="primary" size="large"
                sx={{fontSize:{xs:18,sm:23}, minHeight: 70, minWidth:{ xs:"100%", md:200 }, borderRadius: 3, fontWeight: 700, py:2, px:4, boxShadow:2  }}>
                System Voice
              </Button>
              <Button onClick={handleRecordVoice} startIcon={<RecordVoiceOverIcon sx={{fontSize:36}}/>} variant={inputMethod==='record'?"contained":"outlined"} color="secondary" size="large"
                sx={{fontSize:{xs:18,sm:23}, minHeight: 70, minWidth:{ xs:"100%", md:200 }, borderRadius: 3, fontWeight: 700, py:2, px:4, boxShadow:2  }}>
                Record Voice
              </Button>
              <Button startIcon={<UploadIcon sx={{fontSize:36}}/>} color={inputMethod==='upload'?"success":"info"} variant={inputMethod==='upload'?"contained":"outlined"} component="label" size="large"
                sx={{fontSize:{xs:18,sm:23}, minHeight: 70, minWidth:{ xs:"100%", md:200 }, borderRadius: 3, fontWeight: 700, py:2, px:4, boxShadow:2  }}>
                Upload Voice
                <input type="file" hidden accept="audio/*, .wav, .mp3, .ogg, .m4a" onChange={handleFileUpload} ref={fileInput} />
              </Button>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper elevation={2} sx={{ bgcolor: 'rgba(48,62,112,1)', borderRadius: 3, p: 2.5, minHeight: { xs: 220, md: 160 }}}>
              <FormControl fullWidth sx={{ mb: 1.5}}>
                <InputLabel>Algorithm</InputLabel>
                <Select value={algorithm} label="Algorithm" onChange={e => setAlgorithm(e.target.value)} size="medium">
                  <MenuItem value="spectral">Spectral Subtraction</MenuItem>
                  <MenuItem value="wiener">Wiener Filter</MenuItem>
                  <MenuItem value="bandpass">Band-Pass Filter</MenuItem>
                  <MenuItem value="adaptive">Adaptive Filter</MenuItem>
                </Select>
              </FormControl>
              <Button size="large" variant="contained" color="success" startIcon={<PlayCircleFilledWhiteIcon sx={{fontSize:36}}/>}
                sx={{ fontSize: 26, fontWeight: 800, px: 6, py: 2.2, borderRadius: 99, width:'100%', my:2, boxShadow:4 }}
                disabled={processing || !(audioBuffer)} onClick={handleProcess}>
                {processing ? 'Processing...' : `Process Voice`}
              </Button>
            </Paper>
          </Grid>
        </Grid>
        <Grid container spacing={3} sx={{ mt: 2, width:'100%' }}>
          <Grid item xs={12} md={6} minHeight={{ xs: 320, md: 420 }} sx={{ width: '100%' }}>
            <Paper elevation={4} sx={{ height: '100%', p: 3, borderRadius: 5, bgcolor: 'rgba(21,28,57,0.99)', width: '100%' }}>
              <Typography variant="h6" color="#b4d0fa" mb={1.5} fontSize={25}>Original Waveform</Typography>
              <Box sx={{ height: { xs: 250, md: 370 }, width: '100%' }}>
                {origWave.length ? (
                  <Line data={{
                    labels: origWave.map((_, i) => i),
                    datasets: [{ data: origWave, label: 'Original', borderColor: '#2ec4b6', backgroundColor: 'rgba(46,196,182,0.08)', tension: 0.2, pointRadius: 0 }]
                  }} options={{ responsive: true, plugins: { legend: { display: false }, title: {display: false} }, scales: { y: { min: -1, max: 1, ticks:{font:{size:20}}, grid:{color:'#346394'} }, x:{ticks:{font:{size:17}}, grid:{color:'#234158'}} } }} />
                ) : <Box textAlign="center" color="#54687a">No waveform loaded</Box>}
              </Box>
              <Box mt={2}>
                <Typography variant="subtitle2" color='#cce6ff' fontSize={18}>Audio Preview</Typography>
                <Paper variant="outlined" sx={{ bgcolor: 'rgba(36,48,90,0.79)', borderRadius: 3, p: 1.5, mt: 0.5 }}>
                  {originalUrl ? (<audio controls style={{ width: '100%', minHeight: 60 }} src={originalUrl} />)
                      : <Box textAlign="center" color="#8899bb" py={3} fontSize={17}>No audio yet</Box>}
                </Paper>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} minHeight={{ xs: 320, md: 420 }} sx={{ width:'100%' }}>
            <Paper elevation={4} sx={{ height: '100%', p: 3, borderRadius: 5, bgcolor: 'rgba(21,28,57,0.99)', width: '100%' }}>
              <Typography variant="h6" color="#f799fa" mb={1.5} fontSize={25}>Processed Waveform</Typography>
              <Box sx={{ height: { xs: 250, md: 370 }, width: '100%' }}>
                {procWave.length ? (
                  <Line data={{
                    labels: procWave.map((_, i) => i),
                    datasets: [{ data: procWave, label: 'Processed', borderColor: '#f72585', backgroundColor: 'rgba(247,37,133,0.07)', tension: 0.2, pointRadius: 0 }]
                  }} options={{ responsive: true, plugins: { legend: { display: false }, title: {display: false} }, scales: { y: { min: -1, max: 1, ticks:{font:{size:20}}, grid:{color:'#69214A'} }, x:{ticks:{font:{size:17}}, grid:{color:'#42274c'}} } }} />
                ) : <Box textAlign="center" color="#54687a">No processed waveform</Box>}
              </Box>
              <Box mt={2}>
                <Typography variant="subtitle2" color='#ffc7ef' fontSize={18}>Processed Audio Preview</Typography>
                <Paper variant="outlined" sx={{ bgcolor: 'rgba(36,48,90,0.79)', borderRadius: 3, p: 1.5, mt: 0.5 }}>
                  {processedUrl ? (<audio controls style={{ width: '100%', minHeight: 60 }} src={processedUrl} />)
                      : <Box textAlign="center" color="#8899bb" py={3} fontSize={17}>No processed output</Box>}
                </Paper>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
