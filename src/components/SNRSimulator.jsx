import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography, Grid, Slider, Select, MenuItem, FormControl, InputLabel, Button, Paper, Box } from "@mui/material";
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import CalculateIcon from '@mui/icons-material/Calculate';
import { Line } from 'react-chartjs-2';
import {
  generateWhiteNoise,
  generateShotNoise,
  generateThermalNoise,
  generateSineSignal,
  generateSquareSignal,
  generateDigitalSignal,
  addNoise,
  calculateSignalPower,
  calculateSNR
} from '../utils/noiseUtils';

export default function SNRSimulator() {
  // Inputs
  const [snrDb, setSnrDb] = useState(10);
  const [noiseType, setNoiseType] = useState('white');
  const [signalType, setSignalType] = useState('sine');
  const [signal, setSignal] = useState([]);
  const [noisySignal, setNoisySignal] = useState([]);
  const [calculations, setCalculations] = useState({signalPower:'--',noisePower:'--',calculatedSNR:'--',targetSNR:'--'});
  // Actually generate everything
  const recalc = () => {
    let clean, noise, noisy;
    if(signalType==='sine') clean = generateSineSignal(200);
    else if(signalType==='square') clean = generateSquareSignal(200);
    else clean = generateDigitalSignal(200);
    if(noiseType==='white') noise = generateWhiteNoise(200);
    else if(noiseType==='shot') noise = generateShotNoise(200,5);
    else noise = generateThermalNoise(200,300,1000);
    noisy = addNoise(clean, noise, snrDb);
    const signalPower = calculateSignalPower(clean);
    const noisePower = calculateSignalPower(noisy.map((n,i)=>n-clean[i]));
    const calculatedSNR = calculateSNR(clean, noisy).toFixed(2)+" dB";
    setSignal(clean);
    setNoisySignal(noisy);
    setCalculations({signalPower: signalPower.toFixed(4),noisePower: noisePower.toFixed(4),calculatedSNR,targetSNR: snrDb+" dB"});
  }
  useEffect(recalc, [snrDb,noiseType,signalType]);

  const chartData = {
    labels: signal.map((_, i) => i),
    datasets: [
      {
        label: 'Clean Signal', data: signal, borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.18)', tension: 0.08, pointRadius: 0,
      },
      {
        label: 'Noisy Signal', data: noisySignal, borderColor: '#f472b6', backgroundColor: 'rgba(244,114,182,0.09)', tension: 0.08, pointRadius: 0,
      }
    ],
  };

  return (
    <Card elevation={10} sx={{ borderRadius: 5, bgcolor: 'rgba(35,45,98,0.81)', width:'100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2.5} gap={1}>
          <SignalCellularAltIcon fontSize="large" color="primary" />
          <Typography variant="h4" fontWeight={800} color="#e0e8fa">Signal-to-Noise Ratio (SNR) Simulator</Typography>
        </Box>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={5} sx={{ borderRadius: 4, p: 4, mb: 2, bgcolor: 'rgba(51,57,116,0.80)' }}>
              <Typography variant="subtitle1" color="#b3c4dd" gutterBottom fontSize={21}>Simulation Controls</Typography>
              <FormControl fullWidth sx={{ mb: 3 }} size="medium">
                <InputLabel id="signal-type-label">Signal Type</InputLabel>
                <Select labelId="signal-type-label" value={signalType} label="Signal Type" onChange={e => setSignalType(e.target.value)} size="medium">
                  <MenuItem value="sine">Sine Wave</MenuItem>
                  <MenuItem value="square">Square Wave</MenuItem>
                  <MenuItem value="digital">Digital Signal</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 3 }} size="medium">
                <InputLabel id="noise-type-label">Noise Type</InputLabel>
                <Select labelId="noise-type-label" value={noiseType} label="Noise Type" onChange={e => setNoiseType(e.target.value)} size="medium">
                  <MenuItem value="white">White Noise</MenuItem>
                  <MenuItem value="shot">Shot Noise</MenuItem>
                  <MenuItem value="thermal">Thermal Noise</MenuItem>
                </Select>
              </FormControl>
              <Typography gutterBottom fontSize={18}>Target SNR: <b>{snrDb} dB</b></Typography>
              <Slider value={snrDb} min={-10} max={30} step={1} onChange={(_,v) => setSnrDb(v)} valueLabelDisplay="on" sx={{ mb: 3 }} size="medium" />
              <Button variant="contained" color="success" size="large" fullWidth sx={{ borderRadius: 3, fontWeight: 900, fontSize: 22, py: 2, mt:1, boxShadow:2 }} onClick={recalc}>Regenerate Signals</Button>
            </Paper>
            <Paper elevation={3} sx={{ px: 3, py: 4, borderRadius: 3, bgcolor: 'rgba(36,48,90,0.74)' }}>
              <Box display="flex" alignItems="center" gap={2} mb={1}><CalculateIcon color="info" fontSize="large" /> <Typography fontSize={21} variant="subtitle2">SNR Analysis</Typography></Box>
              <Typography color="#b7cde9" variant="body1" fontSize={18}>Target SNR: <b>{calculations.targetSNR}</b></Typography>
              <Typography color="#b7cde9" variant="body1" fontSize={18}>Calculated SNR: <b>{calculations.calculatedSNR}</b></Typography>
              <Typography color="#b7cde9" variant="body1" fontSize={18}>Signal Power: <b>{calculations.signalPower}</b></Typography>
              <Typography color="#b7cde9" variant="body1" fontSize={18}>Noise Power: <b>{calculations.noisePower}</b></Typography>
              <Typography color="#b7cde9" variant="body1" fontSize={18}>Noise Type: <b>{noiseType.toUpperCase()}</b></Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={5} sx={{ borderRadius: 4, p: 2, display:'flex', flexDirection:'column', bgcolor: 'rgba(31,39,80,0.92)', height:{ xs:350, md:420 }, justifyContent:'center', alignItems:'stretch' }}>
              <Typography variant="subtitle1" color="#bfcfff" gutterBottom fontSize={23} mb={2}>Signal Visualization</Typography>
              <Box sx={{ flex:1, minHeight:340, minWidth:'0', bgcolor: 'rgba(23,29,58,0.63)', borderRadius: 3, p: 2, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Line data={chartData} options={{ responsive: true, plugins: { title: { display: false }, legend: {display:false} }, scales: {
                  y: { beginAtZero: false, ticks:{font:{size:16}} },
                  x: {ticks:{font:{size:12}} }
                } }} />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
