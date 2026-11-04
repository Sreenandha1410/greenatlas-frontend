import { Marker, Popup } from 'react-leaflet';
import { useRef } from 'react';

export default function EditableMarker({
  tree,
  position,
  onPositionChange
}) {
  const markerRef = useRef(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (!marker) return;

      const point = marker.getLatLng();

      onPositionChange({
        latitude: point.lat,
        longitude: point.lng
      });
    }
  };

  return (
    <Marker
      ref={markerRef}
      position={position}
      draggable={true}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <strong>{tree.tree_id}</strong>
        <br />
        {tree.common_name}
      </Popup>
    </Marker>
  );
}
