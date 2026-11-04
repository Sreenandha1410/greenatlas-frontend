
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  useMap,
  useMapEvents
} from 'react-leaflet';

import L from 'leaflet';

import {
  Search,
  MapPin,
  Move,
  MousePointer2,
  Save,
  RotateCcw,
  X,
  Loader2,
  LocateFixed,
  Satellite,
  AlertCircle
} from 'lucide-react';

import { getTrees, updateTreeLocation } from '../api';

// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [11.678, 78.125];
const DEFAULT_ZOOM = 18;

const isValidCoordinate = (value, min, max) => {
  return (
    value !== null &&
    value !== undefined &&
    value !== '' &&
    Number.isFinite(Number(value)) &&
    Number(value) >= min &&
    Number(value) <= max
  );
};

const getPosition = (tree) => ({
  lat: Number(tree.latitude),
  lng: Number(tree.longitude),
});


// Move map to selected tree
function FlyToTree({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(
        [position.lat, position.lng],
        20,
        { duration: 0.8 }
      );
    }
  }, [position, map]);

  return null;
}


// Capture map clicks in placement mode
function MapClickHandler({ enabled, onSelect }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;

      onSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return null;
}


// Main editor component
export default function LocationEditorPage() {
  const navigate = useNavigate();

  const role = localStorage.getItem('role');

  const [trees, setTrees] = useState([]);
  const [selectedTree, setSelectedTree] = useState(null);

  const [search, setSearch] = useState('');

  const [mode, setMode] = useState('drag');

  const [newPosition, setNewPosition] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const markerRef = useRef(null);

  // Load all trees
  useEffect(() => {
    if (role !== 'admin') {
      setLoading(false);
      return;
    }

    getTrees()
      .then((res) => {
        setTrees(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error('Failed to load trees:', err);
        setError('Unable to load tree locations.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [role]);

  // Trees with valid coordinates
  const validTrees = useMemo(() => {
    return trees.filter(
      (tree) =>
        isValidCoordinate(tree.latitude, -90, 90) &&
        isValidCoordinate(tree.longitude, -180, 180)
    );
  }, [trees]);

  // Search functionality
  const filteredTrees = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return trees;

    return trees.filter((tree) =>
      [
        tree.tree_id,
        tree.common_name,
        tree.botanical_name,
        tree.area,
        tree.family,
        tree.tamil_name,
      ].some((value) =>
        String(value || '').toLowerCase().includes(q)
      )
    );
  }, [trees, search]);

  // Current position of selected tree
  const originalPosition = selectedTree
    ? getPosition(selectedTree)
    : null;

  const displayedPosition = newPosition || originalPosition;

  const hasChanges =
    selectedTree &&
    newPosition &&
    (
      newPosition.lat !== originalPosition.lat ||
      newPosition.lng !== originalPosition.lng
    );

  // Select a tree
  const handleSelectTree = (tree) => {
    setSelectedTree(tree);
    setNewPosition(null);
    setError('');
    setMessage('');

    if (
      isValidCoordinate(tree.latitude, -90, 90) &&
      isValidCoordinate(tree.longitude, -180, 180)
    ) {
      // Existing position is handled by FlyToTree
    } else {
      setMessage(
        'This tree has no valid coordinates. Select a location on the map.'
      );
    }
  };

  // Drag marker or click map
  const handlePositionChange = (position) => {
    setNewPosition(position);
    setMessage('');
    setError('');
  };

  // Undo unsaved changes
  const handleUndo = () => {
    setNewPosition(null);
    setError('');
    setMessage('Changes discarded. Original position restored.');
  };

  // Cancel selection
  const handleCancel = () => {
    setSelectedTree(null);
    setNewPosition(null);
    setError('');
    setMessage('');
  };

  // Save coordinates to backend
  const handleSave = async () => {
    if (!selectedTree || !newPosition || saving) return;

    const { lat, lng } = newPosition;

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setError('Invalid latitude or longitude.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');

      await updateTreeLocation(selectedTree.tree_id, {
        latitude: lat,
        longitude: lng,
      });

      // Update frontend data after successful database update
      const updatedTree = {
        ...selectedTree,
        latitude: lat,
        longitude: lng,
      };

      setTrees((previous) =>
        previous.map((tree) =>
          tree.tree_id === selectedTree.tree_id
            ? updatedTree
            : tree
        )
      );

      setSelectedTree(updatedTree);
      setNewPosition(null);

      setMessage(
        `Location updated successfully for ${selectedTree.tree_id}.`
      );

    } catch (err) {
      console.error('Location update failed:', err);

      setError(
        err.response?.data?.error ||
        'Failed to update tree location. Please try again.'
      );

    } finally {
      setSaving(false);
    }
  };

  // Admin protection
  if (role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle size={44} className="text-red-500" />

        <h2 className="text-xl font-bold">
          Access Denied
        </h2>

        <p className="text-gray-500 text-sm">
          Only administrators can edit tree locations.
        </p>

        <button
          onClick={() => navigate('/login')}
          className="btn-primary px-5 py-2"
        >
          Login as Administrator
        </button>
      </div>
    );
  }

  // Loading screen
  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center gap-3">
        <Loader2 className="animate-spin" />
        Loading tree locations...
      </div>
    );
  }

  const mapCenter = displayedPosition
    ? [displayedPosition.lat, displayedPosition.lng]
    : DEFAULT_CENTER;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950">

      {/* HEADER */}
      <header className="shrink-0 px-4 py-3 border-b bg-white dark:bg-gray-900 dark:border-gray-700">

        <div className="flex flex-wrap items-center justify-between gap-3">

          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Tree Location Editor
            </h1>

            <p className="text-xs text-gray-500 mt-1">
              GreenAtlas / Admin / Location Management
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">

            <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-800">
              {validTrees.length} Located
            </span>

            <span className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-800">
              {trees.length - validTrees.length} Missing coordinates
            </span>

            <button
              onClick={() => navigate('/admin')}
              className="px-3 py-2 rounded-lg border text-sm dark:border-gray-600 dark:text-white"
            >
              Back to Admin
            </button>

          </div>
        </div>
      </header>


      {/* MAIN CONTENT */}
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">

        {/* LEFT SIDEBAR */}
        <aside className="w-full md:w-80 lg:w-96 shrink-0 bg-white dark:bg-gray-900 border-r dark:border-gray-700 flex flex-col">

          {/* SEARCH */}
          <div className="p-4 border-b dark:border-gray-700">

            <h2 className="font-semibold text-sm mb-3 dark:text-white">
              Select a Tree
            </h2>

            <div className="relative">

              <Search
                size={17}
                className="absolute left-3 top-3 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search ID, name or area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
              />

            </div>

            <p className="text-xs text-gray-400 mt-2">
              {filteredTrees.length} matching trees
            </p>

          </div>


          {/* TREE LIST */}
          <div className="flex-1 overflow-y-auto">

            {filteredTrees.map((tree) => {

              const isSelected =
                selectedTree?.tree_id === tree.tree_id;

              const hasCoordinates =
                isValidCoordinate(tree.latitude, -90, 90) &&
                isValidCoordinate(tree.longitude, -180, 180);

              return (
                <button
                  key={tree.tree_id}
                  onClick={() => handleSelectTree(tree)}
                  className={`w-full text-left px-4 py-3 border-b dark:border-gray-800 transition-colors ${
                    isSelected
                      ? 'bg-green-50 border-l-4 border-l-green-600 dark:bg-green-950'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >

                  <div className="flex items-start justify-between gap-2">

                    <div className="min-w-0">

                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {tree.tree_id}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {tree.common_name || 'Unknown tree'}
                      </p>

                      <p className="text-xs text-gray-400 truncate">
                        {tree.area || 'Area not specified'}
                      </p>

                    </div>

                    <span
                      className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                        hasCoordinates
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {hasCoordinates ? 'Located' : 'Missing'}
                    </span>

                  </div>

                </button>
              );
            })}

            {filteredTrees.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-10">
                No trees found.
              </p>
            )}

          </div>

        </aside>


        {/* RIGHT MAP AREA */}
        <main className="flex-1 min-w-0 min-h-[400px] flex flex-col relative">

          {/* MAP TOOLBAR */}
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-gray-900 border-b dark:border-gray-700">

            <div className="flex gap-2">

              <button
                onClick={() => setMode('drag')}
                disabled={!selectedTree}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  mode === 'drag'
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 dark:text-white'
                } disabled:opacity-40`}
              >
                <Move size={16} />
                Drag Marker
              </button>

              <button
                onClick={() => setMode('place')}
                disabled={!selectedTree}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  mode === 'place'
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 dark:text-white'
                } disabled:opacity-40`}
              >
                <MousePointer2 size={16} />
                Place Marker
              </button>

            </div>

            <div className="flex gap-2">

              {hasChanges && (
                <button
                  onClick={handleUndo}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-100 text-orange-800 text-sm"
                >
                  <RotateCcw size={15} />
                  Undo
                </button>
              )}

              {selectedTree && (
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 dark:text-white text-sm"
                >
                  <X size={15} />
                  Cancel
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Save size={16} />
                }

                {saving ? 'Saving...' : 'Save Location'}
              </button>

            </div>

          </div>


          {/* MAP INSTRUCTIONS */}
          {selectedTree && (
            <div className="shrink-0 px-4 py-2 bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 text-xs">

              {mode === 'drag'
                ? 'Drag the selected tree marker to its correct position on the satellite map.'
                : 'Click the correct location on the satellite map to place the selected tree marker.'
              }

            </div>
          )}


          {/* STATUS MESSAGES */}
          {(error || message) && (
            <div className={`shrink-0 px-4 py-2 text-sm ${
              error
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-50 text-blue-800'
            }`}>
              {error || message}
            </div>
          )}


          {/* MAP */}
          <div className="flex-1 min-h-0 relative">

            <MapContainer
              key="greenatlas-location-editor"
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              className="h-full w-full"
              style={{ height: '100%', width: '100%' }}
            >

              <LayersControl position="topright">

                <LayersControl.BaseLayer
                  checked
                  name="Satellite"
                >
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="Tiles © Esri"
                    maxZoom={19}
                  />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Street">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="© OpenStreetMap contributors"
                    maxZoom={19}
                  />
                </LayersControl.BaseLayer>

              </LayersControl>


              {/* Fly to selected tree */}
              <FlyToTree
                position={
                  selectedTree &&
                  isValidCoordinate(
                    selectedTree.latitude, -90, 90
                  ) &&
                  isValidCoordinate(
                    selectedTree.longitude, -180, 180
                  )
                    ? {
                        lat: Number(selectedTree.latitude),
                        lng: Number(selectedTree.longitude),
                      }
                    : null
                }
              />


              {/* Map click handler */}
              <MapClickHandler
                enabled={Boolean(
                  selectedTree && mode === 'place'
                )}
                onSelect={handlePositionChange}
              />


              {/* Existing tree markers */}
              {validTrees.map((tree) => {

                const isSelected =
                  selectedTree?.tree_id === tree.tree_id;

                // Selected tree uses its proposed position
                const position =
                  isSelected && newPosition
                    ? [newPosition.lat, newPosition.lng]
                    : [
                        Number(tree.latitude),
                        Number(tree.longitude)
                      ];

                return (
                  <Marker
                    key={tree.tree_id}
                    position={position}
                    draggable={Boolean(
                      isSelected && mode === 'drag'
                    )}
                    ref={isSelected ? markerRef : null}
                    eventHandlers={{
                      click: () => {
                        handleSelectTree(tree);
                      },

                      dragend: (e) => {
                        const point =
                          e.target.getLatLng();

                        handlePositionChange({
                          lat: point.lat,
                          lng: point.lng,
                        });
                      },
                    }}
                  >

                    <Popup>
                      <div className="text-sm">
                        <strong>{tree.tree_id}</strong>
                        <br />
                        {tree.common_name}
                        <br />
                        {tree.area}
                        <br />

                        <button
                          onClick={() => handleSelectTree(tree)}
                          className="text-green-700 font-semibold mt-2"
                        >
                          Select this tree
                        </button>
                      </div>
                    </Popup>

                  </Marker>
                );
              })}


              {/* Temporary marker for trees without coordinates */}
              {selectedTree &&
                !isValidCoordinate(
                  selectedTree.latitude, -90, 90
                ) &&
                !newPosition && null
              }

              {/* New proposed location marker */}
              {selectedTree && newPosition && (
                <Marker
                  position={[
                    newPosition.lat,
                    newPosition.lng
                  ]}
                  draggable={mode === 'drag'}
                  eventHandlers={{
                    dragend: (e) => {
                      const point =
                        e.target.getLatLng();

                      handlePositionChange({
                        lat: point.lat,
                        lng: point.lng,
                      });
                    },
                  }}
                >
                  <Popup>
                    Proposed location for{' '}
                    {selectedTree.tree_id}
                  </Popup>
                </Marker>
              )}

            </MapContainer>


            {/* EMPTY SELECTION MESSAGE */}
            {!selectedTree && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] bg-white dark:bg-gray-900 shadow-lg rounded-xl px-5 py-3 text-sm text-gray-600 dark:text-gray-200 text-center">
                <MapPin size={18} className="inline mr-2 text-green-700" />
                Select a tree from the sidebar to edit its location.
              </div>
            )}

          </div>


          {/* COORDINATE PANEL */}
          {selectedTree && (
            <div className="shrink-0 p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-700">

              <div className="flex flex-wrap justify-between items-center gap-3">

                <div>

                  <h3 className="font-semibold text-sm dark:text-white">
                    {selectedTree.tree_id} — {selectedTree.common_name}
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    {selectedTree.botanical_name || 'Botanical name unavailable'}
                  </p>

                </div>

                <div className="flex flex-wrap gap-4 text-xs">

                  <div>
                    <p className="text-gray-400 mb-1">
                      Latitude
                    </p>

                    <p className="font-mono font-semibold dark:text-white">
                      {displayedPosition
                        ? displayedPosition.lat.toFixed(8)
                        : 'Not set'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400 mb-1">
                      Longitude
                    </p>

                    <p className="font-mono font-semibold dark:text-white">
                      {displayedPosition
                        ? displayedPosition.lng.toFixed(8)
                        : 'Not set'}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400 mb-1">
                      Status
                    </p>

                    <p className={`font-semibold ${
                      hasChanges
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}>
                      {hasChanges
                        ? 'Unsaved changes'
                        : 'Original location'}
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}

        </main>

      </div>
    </div>
  );
}
