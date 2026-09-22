import { useState } from 'react'
import MapView from './components/MapView'

function App() {
  // Default coordinates set to London [Latitude, Longitude]
  const [position, setPosition] = useState<[number, number]>([51.505, -0.09])
  const [error, setError] = useState<string | null>(null)

  // Function to request user's browser GPS location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Update state with live coordinates -> triggers map re-render
        setPosition([pos.coords.latitude, pos.coords.longitude])
        setError(null)
      },
      (err) => {
        setError(err.message)
      }
    )
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>My First Geospatial Map</h1>
      <p>Click the button to move the map pin to your location.</p>
      
      <button 
        onClick={handleGetLocation} 
        style={{ padding: '10px 16px', fontSize: '16px', cursor: 'pointer', marginBottom: '20px' }}
      >
        Get My Location
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Renders the child component and passes the position state as a prop */}
      <MapView position={position} />
    </div>
  )
}

export default App