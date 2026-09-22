import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

type MapViewProps = {
  position: [number, number] // [Latitude, Longitude]
}

function MapView(props: MapViewProps) {
  return (
    <MapContainer
      center={props.position}
      zoom={13}
      style={{ height: '500px', width: '100%', borderRadius: '8px' }}
    >
      {/* Background visual tiles from OpenStreetMap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Pin placed on the map */}
      <Marker position={props.position}>
        <Popup>
          Selected Location: <br />
          Lat: {props.position[0]}, Lng: {props.position[1]}
        </Popup>
      </Marker>
    </MapContainer>
  )
}

export default MapView