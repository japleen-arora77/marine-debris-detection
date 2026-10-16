import { useEffect, useMemo, useRef, useState } from "react";
import { getOriginalImageUrl } from "../services/api";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  ArrowLeft,
  MapPin,
  Layers,
  Image as ImageIcon,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

import "leaflet/dist/leaflet.css";
import "../components/map/PollutionMapSection.css";
import "./PollutionMapPage.css";

const API_BASE_URL = "http://127.0.0.1:8000";


function getPriority(count, minCount, maxCount) {
    if (minCount === maxCount) {
      return "high";
    }
  
    const relativeLevel =
      (count - minCount) / (maxCount - minCount);
  
    if (relativeLevel >= 0.67) return "high";
    if (relativeLevel >= 0.34) return "medium";
    return "low";
  }
  

function createIcon(priority) {
  const colors = {
    high: "#DC3545",
    medium: "#F59E0B",
    low: "#16A34A",
  };

  return L.divIcon({
    className: "pollution-marker-wrapper",
    html: `<span style="
      display:block;
      width:20px;
      height:20px;
      border-radius:50%;
      background:${colors[priority]};
      border:3px solid white;
      box-shadow:0 2px 8px #0b254566;
    "></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

// Automatically adjust the map to show all observations.
function FitObservations({ observations }) {
  const map = useMap();

  useEffect(() => {
    const points = observations
      .filter(
        (item) =>
          Number.isFinite(Number(item.latitude)) &&
          Number.isFinite(Number(item.longitude))
      )
      .map((item) => [
        Number(item.latitude),
        Number(item.longitude),
      ]);

    if (points.length === 1) {
      map.setView(points[0], 12);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 12 });
    }
  }, [observations, map]);

  return null;
}

function getMajorCategory(detections = []) {
  if (!detections.length) return "No debris detected";

  const counts = {};

  detections.forEach((detection) => {
    const category = detection.class_name || "Unknown";
    counts[category] = (counts[category] || 0) + 1;
  });

  return Object.entries(counts).sort(
    (a, b) => b[1] - a[1]
  )[0][0];
}

function getCategories(detections = []) {
  return [
    ...new Set(
      detections.map((item) => item.class_name || "Unknown")
    ),
  ];
}

function formatDate(dateString) {
  if (!dateString) return "Not available";

  const date = new Date(dateString);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString();
}

export default function PollutionMapPage() {
    const detailsPanelRef = useRef(null);
  const [observations, setObservations] = useState([]);
  const [selectedObservation, setSelectedObservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMarkers, setShowMarkers] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadObservations() {
      setLoading(true);
      setError("");

      try {
        const allItems = [];
        const limit = 100;
        let offset = 0;
        let total = Infinity;

        while (offset < total) {
          const response = await fetch(
            `${API_BASE_URL}/api/analyses?limit=${limit}&offset=${offset}`
          );

          if (!response.ok) {
            throw new Error("Could not load observation history.");
          }

          const data = await response.json();

          allItems.push(...(data.items || []));
          total = Number(data.total) || 0;

          if (!data.items?.length) break;

          offset += data.items.length;
        }

        if (!cancelled) {
          setObservations(allItems);

          // Select the first observation that has coordinates.
          const firstLocated = allItems.find(
            (item) =>
              item.latitude != null &&
              item.longitude != null
          );

          setSelectedObservation(firstLocated || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "An error occurred while loading the map."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadObservations();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedObservation || loading || error) return;
  
    detailsPanelRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [selectedObservation, loading, error]);

  const locatedObservations = useMemo(
    () =>
      observations.filter(
        (item) =>
          item.latitude != null &&
          item.longitude != null &&
          Number.isFinite(Number(item.latitude)) &&
          Number.isFinite(Number(item.longitude)) &&
          Number(item.latitude) >= -90 &&
          Number(item.latitude) <= 90 &&
          Number(item.longitude) >= -180 &&
          Number(item.longitude) <= 180
      ),
    [observations]
  );

  
const debrisCounts = locatedObservations.map(
    (item) => item.detections?.length || 0
  );
  
  const minCount = Math.min(...debrisCounts);
  const maxCount = Math.max(...debrisCounts);
  

  const selectedDetections = selectedObservation?.detections || [];
  const categories = getCategories(selectedDetections);
  const majorCategory = getMajorCategory(selectedDetections);
  const debrisCount = selectedDetections.length;

  const originalImageUrl = selectedObservation
  ? getOriginalImageUrl(selectedObservation.id)
  : "";

  return (
    <main className="pollution-page">
      <header className="pollution-page-header">
        <button
          type="button"
          className="pollution-back-button"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div>
          <h1>Marine Pollution Map</h1>
          <p>
            Explore observation locations, detected debris, and
            their verification details.
          </p>
        </div>

        <button
          type="button"
          className="pollution-toggle-button"
          onClick={() => setShowMarkers((value) => !value)}
        >
          <Layers size={17} />
          {showMarkers ? "Hide markers" : "Show markers"}
        </button>
      </header>

      <section className="pollution-map-toolbar">
        <div className="pollution-map-legend">
          <span>
            <i className="legend-dot high" />
            High debris (20+)
          </span>
          <span>
            <i className="legend-dot medium" />
            Medium debris (8–19)
          </span>
          <span>
            <i className="legend-dot low" />
            Low debris (0–7)
          </span>
        </div>

        <span className="pollution-map-hint">
          <MapPin size={15} />
          Select a marker to view its observation details.
        </span>
      </section>

      {loading && (
        <div className="pollution-message">
          <LoaderCircle size={20} />
          Loading observations...
        </div>
      )}

      {error && (
        <div className="pollution-message pollution-error">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="pollution-full-map">
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              scrollWheelZoom
              className="pollution-full-leaflet"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FitObservations observations={locatedObservations} />

              {showMarkers &&
                locatedObservations.map((item) => {
                  const count = item.detections?.length || 0;
                  const priority = getPriority(count, minCount, maxCount);

                  return (
                    <Marker
                      key={item.id}
                      position={[
                        Number(item.latitude),
                        Number(item.longitude),
                      ]}
                      icon={createIcon(priority)}
                      eventHandlers={{
                        click: () => setSelectedObservation(item),
                      }}
                    >
                      <Popup>
                        <strong>
                          {item.location_name || "Observation location"}
                        </strong>
                        <p>Debris detected: {count}</p>
                        <p>Priority: {priority.toUpperCase()}</p>
                        <button
                          type="button"
                          onClick={() => setSelectedObservation(item)}
                        >
                          View details
                        </button>
                      </Popup>
                    </Marker>
                  );
                })}
            </MapContainer>
          </section>

          <p className="pollution-observation-count">
            Showing {showMarkers ? locatedObservations.length : 0} of{" "}
            {locatedObservations.length} located observations
            {" "}({observations.length} saved in total).
          </p>

          {locatedObservations.length === 0 ? (
            <div className="pollution-message">
              No observations with saved coordinates are available yet.
            </div>
          ) : (
            <section
  className="pollution-details-panel"
  ref={detailsPanelRef}
>
              <div className="pollution-details-heading">
                <MapPin size={22} />
                <div>
                  <h2>
                    {selectedObservation?.location_name ||
                      "Observation details"}
                  </h2>
                  <p>
                    {selectedObservation
                      ? `${selectedObservation.latitude}, ${selectedObservation.longitude}`
                      : "Select a map marker to see details."}
                  </p>
                </div>
              </div>

              {selectedObservation && (
                <div className="pollution-details-content">
                  <div className="pollution-original-image">
                    <h3>
                      <ImageIcon size={18} />
                      Original observation image
                    </h3>

                    <img
                      src={originalImageUrl}
                      alt={`Original observation at ${
                        selectedObservation.location_name ||
                        "saved location"
                      }`}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  <div className="pollution-detail-fields">
                    <div className="pollution-detail-item">
                      <span>Total debris count</span>
                      <strong>{debrisCount}</strong>
                    </div>

                    <div className="pollution-detail-item">
                      <span>Major debris category</span>
                      <strong>{majorCategory}</strong>
                    </div>

                    <div className="pollution-detail-item">
                      <span>AI-predicted categories</span>
                      <strong>
                        {categories.length
                          ? categories.join(", ")
                          : "No debris detected"}
                      </strong>
                    </div>

                    <div className="pollution-detail-item">
                      <span>Verification status</span>
                      <strong>
                        {selectedObservation.verification_status === "verified"
                          ? "Verified"
                          : "Pending verification"}
                      </strong>
                    </div>

                    <div className="pollution-detail-item">
                      <span>Observation date</span>
                      <strong>
                        {formatDate(selectedObservation.created_at)}
                      </strong>
                    </div>

                    <div className="pollution-detail-item">
                      <span>Debris-count priority</span>
                      <strong>
                        {getPriority(debrisCount, minCount, maxCount).toUpperCase()}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
