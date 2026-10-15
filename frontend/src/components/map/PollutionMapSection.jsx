import { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { MapPin, ExternalLink } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./PollutionMapSection.css";

const COLORS = {
  high: "#DC3545",
  medium: "#F59E0B",
  low: "#16A34A",
};

function getPriority(count) {
  if (count >= 20) return "high";
  if (count >= 8) return "medium";
  return "low";
}

function makeMarkerIcon(priority) {
  return L.divIcon({
    className: "pollution-marker-wrapper",
    html: `<span class="pollution-marker pollution-marker-${priority}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function FitMapToObservations({ observations }) {
  const map = useMap();

  useMemo(() => {
    const points = observations
      .filter(
        (item) =>
          Number.isFinite(Number(item.latitude)) &&
          Number.isFinite(Number(item.longitude)) &&
          item.latitude !== null &&
          item.longitude !== null
      )
      .map((item) => [
        Number(item.latitude),
        Number(item.longitude),
      ]);

    if (points.length === 1) {
      map.setView(points[0], 12);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [35, 35], maxZoom: 12 });
    }
  }, [map, observations]);

  return null;
}

function ObservationMarkers({ observations, interactive }) {
  return observations.map((item) => {
    if (
      item.latitude == null ||
      item.longitude == null ||
      !Number.isFinite(Number(item.latitude)) ||
      !Number.isFinite(Number(item.longitude))
    ) {
      return null;
    }

    const count = Number(item.debris_count);
    const priority = getPriority(Number.isFinite(count) ? count : 0);
    const position = [
      Number(item.latitude),
      Number(item.longitude),
    ];

    return (
      <Marker
        key={item.id ?? `${position[0]}-${position[1]}`}
        position={position}
        icon={makeMarkerIcon(priority)}
        interactive={interactive}
      >
        {interactive && (
          <Popup>
            <div className="pollution-popup">
              <strong>{item.location_name || "Observation location"}</strong>
              <p>Debris detected: {Number.isFinite(count) ? count : "Not available"}</p>
              <p>Priority: {priority.toUpperCase()}</p>
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt="Observed coastal area"
                  className="pollution-popup-image"
                />
              )}
            </div>
          </Popup>
        )}
      </Marker>
    );
  });
}


export default function PollutionMapSection({ observations = [] }) {
  const validObservations = observations.filter(
    (item) =>
      item.latitude != null &&
      item.longitude != null &&
      Number.isFinite(Number(item.latitude)) &&
      Number.isFinite(Number(item.longitude))
  );

  const previewCenter = validObservations.length
    ? [
        Number(validObservations[0].latitude),
        Number(validObservations[0].longitude),
      ]
    : [20, 0];

  function openPollutionMap() {
    window.location.href = "/pollution-map";
  }

  return (
    <section className="details-card">
      <div className="block-heading">
        <div className="block-heading-icon">
          <MapPin size={20} />
        </div>

        <div>
          <h3>Observation Location</h3>
          <p>Pollution overview of observation sites.</p>
        </div>
      </div>

      <div className="pollution-preview-map">
        <MapContainer
          center={previewCenter}
          zoom={validObservations.length ? 5 : 2}
          scrollWheelZoom={false}
          dragging={false}
          touchZoom={false}
          doubleClickZoom={false}
          boxZoom={false}
          keyboard={false}
          zoomControl={false}
          className="pollution-leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {validObservations.map((item) => {
            const count = Number(item.debris_count);
            const priority =
              count >= 20 ? "high" : count >= 8 ? "medium" : "low";

            return (
              <Marker
                key={item.id ?? `${item.latitude}-${item.longitude}`}
                position={[
                  Number(item.latitude),
                  Number(item.longitude),
                ]}
                icon={makeMarkerIcon(priority)}
                interactive={false}
              />
            );
          })}
        </MapContainer>
      </div>

      <div className="pollution-map-legend">
        <span><i className="legend-dot high" /> High debris</span>
        <span><i className="legend-dot medium" /> Medium debris</span>
        <span><i className="legend-dot low" /> Low debris</span>
      </div>

      <button
        type="button"
        className="map-link-button"
        onClick={openPollutionMap}
      >
        <MapPin size={18} />
        View on Pollution Map
        <ExternalLink size={16} />
      </button>
    </section>
  );
}

