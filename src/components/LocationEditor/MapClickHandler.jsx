import { useMapEvents } from 'react-leaflet';

export default function MapClickHandler({
  enabled,
  onLocationSelect
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;

      onLocationSelect({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      });
    }
  });

  return null;
}
