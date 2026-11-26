/**
 * DataDojo Engine Configuration Constants
 */
export const CONFIG = {
  PYODIDE_VERSION: '0.26.4',
  PYODIDE_CDN_BASE: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
  EXECUTION_TIMEOUT_MS: 10000,
  STORAGE_KEY: 'datadojo:v1',
  XP: {
    COMPLETE_EXERCISE: 10,
    HINT_FREE_BONUS: 5,
  },
  BELTS: [
    { id: 'white', name: 'White', subtitle: 'Start Here', color: '#f3f4f6' },
    { id: 'yellow', name: 'Yellow', subtitle: 'Python Basics', color: '#fde047' },
    { id: 'orange', name: 'Orange', subtitle: 'NumPy', color: '#fb923c' },
    { id: 'green', name: 'Green', subtitle: 'pandas', color: '#4ade80' },
    { id: 'blue', name: 'Blue', subtitle: 'Visualization', color: '#60a5fa' },
    { id: 'purple', name: 'Purple', subtitle: 'Stats', color: '#c084fc' },
    { id: 'brown', name: 'Brown', subtitle: 'Intro ML', color: '#a8715a' },
    { id: 'black', name: 'Black', subtitle: 'Capstone', color: '#1f2937' },
  ],
};
