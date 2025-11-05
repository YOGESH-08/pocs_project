import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography, Grid, Slider, Select, MenuItem, FormControl, InputLabel, Button, Paper, Box } from "@mui/material";
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import CalculateIcon from '@mui/icons-material/Calculate';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { generateWhiteNoise, generateShotNoise, generateThermalNoise } from '../utils/noiseUtils';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function NoiseGenerator() {
  const [noiseType, setNoiseType] = useState('white');
  const [variance, setVariance] = useState(1);
  const [temperature, setTemperature] = useState(300);
  const [bandwidth, setBandwidth] = useState(1000);
  const [noiseFigure, setNoiseFigure] = useState(3);
  const [noiseData, setNoiseData] = useState([]);
  const [calculations, setCalculations] = useState({ thermalNoise: '--', noiseTemperature: '--', noiseFigure: '--', noiseVariance: '--' });
  // Helper to generate noise
  const recalcNoise = () => {
    let data, thermalV = '--', thermT = '--';
    if(noiseType==='white') {
      data = generateWhiteNoise(200,0,variance);
    } else if(noiseType==='shot') {
      data = generateShotNoise(200,variance*10);
    } else if(noiseType==='thermal') {
      data = generateThermalNoise(200,temperature,bandwidth);
      thermalV = (generateThermalNoise(1,temperature,bandwidth)[0]).toExponential(3)+' V';
      thermT = (290*(Math.pow(10,noiseFigure/10)-1)).toFixed(2)+' K';
    }
    setNoiseData(data);
    setCalculations({
      thermalNoise: thermalV,
      noiseTemperature: thermT,
      noiseFigure: noiseFigure + ' dB',
      noiseVariance: variance.toFixed(3)
    });
  };

  useEffect(recalcNoise, [noiseType,variance,temperature,bandwidth,noiseFigure]);

  const chartData = {
    labels: noiseData.map((_, i) => i),
    datasets: [
      {
        label: `${noiseType.toUpperCase()} Noise`,
        data: noiseData,
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124,58,237,0.15)',
        tension: 0.17,
        pointRadius: 0,
      },
    ],
  };

  return (
    <Card elevation={10} sx={{ borderRadius: 5, bgcolor: 'rgba(35,45,98,0.81)', width:'100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2} gap={1}>
          <GraphicEqIcon fontSize="large" color="primary" />
          <Typography variant="h4" fontWeight={700} color="#e0e8fa">Noise Generator & Analyzer</Typography>
        </Box>
        {/* Controls+Calculations in a row */}
        <Grid container spacing={4} alignItems="flex-start">
          <Grid item xs={12} md={6}>
            <Paper elevation={5} sx={{ borderRadius: 4, p: 4, mb: 2, bgcolor: 'rgba(51,57,116,0.80)' }}>
              <Typography variant="subtitle1" color="#b3c4dd" gutterBottom fontSize={21}>Controls</Typography>
              <Box mb={4}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="noise-type-label">Noise Type</InputLabel>
                  <Select labelId="noise-type-label" value={noiseType} label="Noise Type" onChange={e => setNoiseType(e.target.value)} size="medium">
                    <MenuItem value="white">White Noise</MenuItem>
                    <MenuItem value="shot">Shot Noise</MenuItem>
                    <MenuItem value="thermal">Thermal Noise</MenuItem>
                  </Select>
                </FormControl>
                {noiseType === 'thermal' ? (
                  <>
                    <Typography gutterBottom fontSize={18}>Temperature: <b>{temperature} K</b></Typography>
                    <Slider value={temperature} onChange={(_, v) => setTemperature(v)} step={5} min={100} max={500} sx={{ mb: 4 }} valueLabelDisplay="on" size="medium" />
                    <Typography gutterBottom fontSize={18}>Bandwidth: <b>{bandwidth} Hz</b></Typography>
                    <Slider value={bandwidth} onChange={(_, v) => setBandwidth(v)} step={100} min={100} max={10000} valueLabelDisplay="on" size="medium" />
                  </>
                ) : (
                  <>
                    <Typography gutterBottom fontSize={18}>Variance: <b>{variance}</b></Typography>
                    <Slider value={variance} onChange={(_, v) => setVariance(v)} step={0.1} min={0.1} max={5} valueLabelDisplay="on" sx={{ mb: 4 }} size="medium" />
                  </>
                )}
                <Typography gutterBottom fontSize={18}>Noise Figure: <b>{noiseFigure} dB</b></Typography>
                <Slider value={noiseFigure} onChange={(_, v) => setNoiseFigure(v)} step={0.1} min={0} max={10} valueLabelDisplay="on" sx={{ mb: 4 }} size="medium" />
              </Box>
              <Button variant="contained" color="primary" size="large" fullWidth sx={{ borderRadius: 3, fontWeight: 800, fontSize: 22, py: 2, mt: 2, boxShadow:2 }} onClick={recalcNoise}>
                Generate New Noise
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ px: 3, py: 4, borderRadius: 3, bgcolor: 'rgba(36,48,90,0.74)', height: '100%' }}>
              <Box display="flex" alignItems="center" gap={2} mb={1}><CalculateIcon color="info" fontSize="large" /> <Typography fontSize={21} variant="subtitle2">Key Calculations</Typography></Box>
              <Typography color="#b7cde9" variant="body1" fontSize={18}>Noise Type: <b>{noiseType.toUpperCase()}</b></Typography>
              <Typography color="#b7cde9" variant="body1" fontSize={18}>Thermal Noise Voltage: <b>{calculations.thermalNoise}</b></Typography>
              <Typography color="#b7cde9" variant="body1" fontSize={18}>Noise Temperature: <b>{calculations.noiseTemperature}</b></Typography>
              <Typography color="#b7cde9" variant="body1" fontSize={18}>Noise Figure: <b>{calculations.noiseFigure}</b></Typography>
              <Typography color="#b7cde9" variant="body1" fontSize={18}>Noise Variance: <b>{calculations.noiseVariance}</b></Typography>
            </Paper>
          </Grid>
        </Grid>
        {/* Full width big chart below */}
        <Box mt={5} width="100%">
          <Paper elevation={5} sx={{ borderRadius: 4, p: 2, display:'flex', flexDirection:'column', bgcolor: 'rgba(31,39,80,0.92)', minHeight: 400, width:'100%', justifyContent:'center', alignItems:'stretch' }}>
            <Typography variant="subtitle1" color="#bfcfff" gutterBottom fontSize={26} mb={2} align="center">Noise Waveform</Typography>
            <Box sx={{ flex:1, minHeight:370, minWidth:'0', bgcolor: 'rgba(23,29,58,0.63)', borderRadius: 3, p: 2, display:'flex', alignItems:'center', justifyContent:'center', width:'100%' }}>
              <Line data={chartData} options={{ responsive: true, plugins: { title: { display: false }, legend: {display:false} }, 
                scales: { y: { beginAtZero: false, ticks:{font:{size:18}} }, x:{ticks:{font:{size:14}} } } }} />
            </Box>
          </Paper>
        </Box>
      </CardContent>
    </Card>
  );
}
