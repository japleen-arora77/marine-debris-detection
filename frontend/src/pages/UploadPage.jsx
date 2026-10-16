
import { analyzeImage } from "../services/api";
import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import {
  Upload,
  Image as ImageIcon,
  MapPin,
  Search,
  X,
  CheckCircle2,
  LoaderCircle,
  Waves,
  Navigation,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./UploadPage.css";

const DEFAULT_CENTER = [20, 0];

function MapController({ position }) {
  const map = useMap();

  if (position) {
    map.flyTo(position, 13, { duration: 0.7 });
  }

  return null;
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

export default function UploadPage({ onAnalysisComplete }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapPosition, setMapPosition] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [pageError, setPageError] = useState("");

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setPageError("");

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        selectedFile.type
      )
    ) {
      setPageError("Please select a JPG, PNG, or WEBP image.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setPageError("The image must be 10 MB or smaller.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }

  function clearImage() {
    if (preview) URL.revokeObjectURL(preview);

    setFile(null);
    setPreview("");
  }

  async function searchLocation(event) {
    event.preventDefault();

    const query = locationQuery.trim();

    if (!query) {
      setSearchError("Enter a beach, coastal area, or place name.");
      return;
    }

    setSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        limit: "5",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Location search is unavailable.");
      }

      const results = await response.json();
      setSearchResults(results);

      if (results.length === 0) {
        setSearchError(
          "No matching places found. Try a more specific name."
        );
      }
    } catch {
      setSearchError(
        "We couldn't search for that location. Check your connection and try again."
      );
    } finally {
      setSearching(false);
    }
  }

  function chooseSearchResult(result) {
    const position = [Number(result.lat), Number(result.lon)];

    setMapPosition(position);
    setSelectedLocation({
      name: result.display_name,
      latitude: position[0],
      longitude: position[1],
    });

    setLocationQuery(result.display_name);
    setSearchResults([]);
    setSearchError("");
  }

  async function chooseMapPosition(position) {
    setMapPosition(position);
    setSearchResults([]);
    setSearchError("");

    setSelectedLocation({
      name: "",
      latitude: position[0],
      longitude: position[1],
    });

    try {
      const params = new URLSearchParams({
        lat: String(position[0]),
        lon: String(position[1]),
        format: "jsonv2",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Reverse geocoding failed");
      }

      const result = await response.json();
      const name = result.display_name || "";

      setSelectedLocation({
        name,
        latitude: position[0],
        longitude: position[1],
      });

      if (name) setLocationQuery(name);
    } catch {
      setSearchError(
        "Location coordinates were selected, but we couldn't retrieve a place name."
      );
    }
  }

  async function handleAnalyze() {
    if (!file) {
      setPageError("Please upload an image before continuing.");
      return;
    }

    if (!selectedLocation) {
      setPageError("Search for a place or select a point on the map.");
      return;
    }

    setPageError("");
    setAnalyzing(true);

    try {
      // Existing backend analysis call.
      const result = await analyzeImage(file, selectedLocation);

      // Keep passing the result to App.jsx and AnalyzeSection.
      onAnalysisComplete?.(result, preview);

      // Scroll to Observation Summary after successful analysis.
      document.getElementById("observation-summary")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } catch (error) {
      console.error("Aqua Scan analysis failed:", error);

      setPageError(
        error.message || "Analysis failed. Please try again."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <main className="upload-page">
      <header className="upload-topbar">
        <div className="upload-brand">
          <span className="brand-mark">
            <Waves size={22} />
          </span>
          <span>AquaScan - Marine Debris Detection System</span>
        </div>

        {/* <div className="upload-steps" aria-label="Analysis progress">
          <div className="step-item active">
            <span className="step-number">1</span>
            <span>Upload</span>
          </div>
          <span className="step-line" />
          <div className="step-item">
            <span className="step-number">2</span>
            <span>Analyze</span>
          </div>
          <span className="step-line" />
          <div className="step-item">
            <span className="step-number">3</span>
            <span>Report</span>
          </div>
        </div> */}
      </header>

      <section className="upload-workspace">
        <div className="upload-panel">
          <div className="section-heading">
            <span className="section-icon">
              <ImageIcon size={23} />
            </span>
            <div>
              <h1>Upload Image</h1>
              <p>
                Upload a clear image of a beach or coastal area for AI
                analysis.
              </p>
            </div>
          </div>

          <label className={`drop-zone ${preview ? "has-image" : ""}`}>
            {preview ? (
              <>
                <img
                  src={preview}
                  alt="Selected coastal area preview"
                  className="image-preview"
                />
                <span className="preview-name">{file?.name}</span>
                <span className="preview-hint">
                  Click to replace image
                </span>
              </>
            ) : (
              <>
                <Upload size={34} strokeWidth={1.5} />
                <strong>Drag &amp; drop your image</strong>
                <span>
                  or <span className="browse-text">browse files</span>
                </span>
                <small>
                  JPG, PNG, WEBP <span>·</span> Max 10 MB
                </small>
              </>
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              hidden
            />
          </label>

          {preview && (
            <button
              type="button"
              className="remove-image"
              onClick={clearImage}
            >
              <X size={15} /> Remove image
            </button>
          )}

          <div className="upload-tip">
            <CheckCircle2 size={16} />
            <span>
              For best results, use a clear, well-lit coastal image.
            </span>
          </div>
        </div>

        <div className="location-panel">
          <div className="section-heading">
            <span className="section-icon">
              <MapPin size={25} />
            </span>
            <div>
              <h2>Choose location</h2>
              <p>Search for the place where the image was taken.</p>
            </div>
          </div>

          <form className="location-search" onSubmit={searchLocation}>
            <Search size={19} />
            <input
              value={locationQuery}
              onChange={(event) => setLocationQuery(event.target.value)}
              placeholder="Search beach or coastal area"
              aria-label="Search for a location"
            />

            {locationQuery && (
              <button
                type="button"
                className="clear-search"
                onClick={() => {
                  setLocationQuery("");
                  setSearchResults([]);
                  setSearchError("");
                }}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}

            <button
              type="submit"
              className="search-submit"
              disabled={searching}
              aria-label="Search locations"
            >
              {searching ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Search size={17} />
              )}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="location-results">
              {searchResults.map((result) => (
                <button
                  type="button"
                  key={result.place_id}
                  onClick={() => chooseSearchResult(result)}
                  className="location-result"
                >
                  <MapPin size={17} />
                  <span>{result.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {searchError && (
            <p className="location-message">{searchError}</p>
          )}

          <div className="map-label-row">
            <span>Map preview</span>
            <span>
              <Navigation size={13} /> Click map to select
            </span>
          </div>

          <div className="location-map">
            <MapContainer
              center={mapPosition || DEFAULT_CENTER}
              zoom={mapPosition ? 13 : 2}
              scrollWheelZoom
              className="leaflet-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController position={mapPosition} />
              <MapClickHandler onSelect={chooseMapPosition} />
              {mapPosition && <Marker position={mapPosition} />}
            </MapContainer>
          </div>

          <div
            className={`selected-location ${
              selectedLocation ? "selected" : ""
            }`}
          >
            <MapPin size={19} />
            <div>
              <strong>
                {selectedLocation?.name ||
                  (selectedLocation
                    ? "Selected map coordinates"
                    : "No location selected")}
              </strong>
              <span>
                {selectedLocation
                  ? `${selectedLocation.latitude.toFixed(5)}, ${selectedLocation.longitude.toFixed(5)}`
                  : "Search for a place or click a point on the map."}
              </span>
            </div>
          </div>
        </div>

        <div className="upload-footer">
          {pageError && (
            <p className="upload-feedback" role="status">
              {pageError}
            </p>
          )}

          <button
            type="button"
            className="analyze-button"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <LoaderCircle className="spin" size={17} />
                Preparing...
              </>
            ) : (
              "Analyze Image"
            )}
          </button>
        </div>
      </section>
    </main>
  );
}
