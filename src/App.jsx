import "./App.css";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function App() {
  return (
    <motion.div
      className="container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={itemVariants}>
        Principles of Communication System Project
      </motion.h1>

      <motion.div className="authors" variants={itemVariants}>
        <p>A Project By:</p>
        <p className="names">Yogesh Kumar N (24BIT0152)</p>
        <p className="names">Gokul S (24BIT0147)</p>
        <p className="names">Shrish V P (24BIT0072)</p>
      </motion.div>

      <motion.div className="objectives" variants={itemVariants}>
        <h2>Primary Objectives</h2>
        <p>
          This project is designed to provide a comprehensive, hands-on
          exploration of noise in communication systems. The primary objectives
          are:
        </p>
        <ul>
          {[
            "To Simulate and Model: To design and implement a platform that accurately simulates fundamental noise types found in communication systems, including Thermal (Johnson-Nyquist) Noise, White (Gaussian) Noise, and Shot Noise.",
            "To Visualize and Analyze: To develop an interactive simulator that visualizes the qualitative and quantitative effects of varying Signal-to-Noise Ratios (SNR) on different signal types (analog and digital).",
            "To Implement and Compare: To implement a suite of core noise suppression algorithms (Spectral Subtraction, Wiener Filter, Adaptive LMS) and allow for their real-time application and comparative analysis on live or imported audio.",
            "To Diagnose Digital Signals: To create a diagnostic tool for digital communications by generating and displaying Eye Patterns, allowing for the visual assessment of signal integrity, noise margin, and jitter.",
            "To Educate and Demonstrate: To provide an accessible, all-in-one educational tool that consolidates noise theory, signal analysis, and advanced processing into a single, interactive web application, bridging the gap between theoretical concepts and practical application.",
          ].map((objective, index) => (
            <motion.li key={index} variants={itemVariants}>
              <strong>{objective.split(":")[0]}:</strong>
              {objective.split(":").slice(1).join(":")}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}

export default App;
