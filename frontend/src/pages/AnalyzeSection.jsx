

import {
  Waves,
  ScanSearch,
  MapPin,
  CalendarDays,
  ShieldCheck,
  Info,
  FileImage,
  ExternalLink,
} from "lucide-react";

import "./AnalyzeSection.css";


const categories = [
  { name: "Bottle", className: "bottle", icon: "♧", modelClasses: ["bottle"] },
  { name: "Plastic bag", className: "plastic", icon: "◇", modelClasses: ["plastic bag"] },
  { name: "Tire", className: "tire", icon: "◉", modelClasses: ["tire"] },
  { name: "Aluminum can", className: "metal", icon: "▤", modelClasses: ["aluminum can"] },
  { name: "Fishing net", className: "fishing", icon: "⌘", modelClasses: ["fishing net"] },
  { name: "Plastic waste", className: "other", icon: "♻", modelClasses: ["plastic waste"] },
];


export default function AnalyzeSection({
  analysisResult,
  originalImageUrl,
}) {
  console.log("Summary analysis result:", analysisResult);
console.log("Original image URL:", originalImageUrl);

const detections = analysisResult?.detections ?? [];

const categoryCounts = detections.reduce((counts, detection) => {
  const category = detection.class_name;
  counts[category] = (counts[category] || 0) + 1;
  return counts;
}, {});

const observationDate = analysisResult?.created_at
  ? new Date(analysisResult.created_at).toLocaleString()
  : "Not available";

  const annotatedImageUrl = analysisResult
    ? `http://127.0.0.1:8000/api/analyses/${analysisResult.id}/annotated-image`
    : null;


  return (
    <section className="analyze-section" id="analyze-section">

      {/* Page Heading */}
      <header className="observation-heading">
        <div className="observation-title-group">
          <div className="observation-title-icon">
            <FileImage size={25} />
          </div>

          <div>
            <div className="observation-breadcrumb">
              Aqua Scan <span>/</span> Detection{" "}
              <span>/</span> Observation Summary
            </div>

            <h2>Observation Summary</h2>

            <p>
              Review the original image, AI predictions, and
              observation details.
            </p>
          </div>
        </div>

        <span className="verification-badge">
          <Info size={17} />
          Awaiting analysis
        </span>
      </header>

      {/* Development Notice */}
      <div className="analysis-disclaimer">
        <Info size={19} />

        <p>
          <strong>Development preview:</strong> AI analysis and
          saved observations are not connected yet. No actual
          detections or confirmed counts are available.
        </p>
      </div>

      {/* Original and Annotated Images */}
      <div className="comparison-grid">

        <article className="comparison-card">
          <div className="comparison-card-heading">
            <FileImage size={19} />
            <h3>Original Image</h3>
          </div>

          
<div className="comparison-placeholder">
  {originalImageUrl ? (
    <img
      src={originalImageUrl}
      alt="Original uploaded marine debris"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
      }}
    />
  ) : (
    <>
      <FileImage size={38} />
      <strong>Original image preview</strong>
      <p>The uploaded image will appear here after analysis.</p>
    </>
  )}
</div>


          <div className="image-caption">
            <span>Source image</span>
            <span>Awaiting connection</span>
          </div>
        </article>

        <article className="comparison-card">
          <div className="comparison-card-heading">
            <ScanSearch size={19} />
            <h3>AI Annotated Image</h3>
          </div>

          
<div className="comparison-placeholder annotated-placeholder">
  {annotatedImageUrl ? (
    <img
      src={annotatedImageUrl}
      alt="AI annotated marine debris image with bounding boxes"
      key={analysisResult.id}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
      }}
    />
  ) : (
    <>
      <ScanSearch size={38} />

      <strong>Annotated image preview</strong>

      <p>
        The annotated image will appear here after AI analysis.
      </p>
    </>
  )}
</div>


          <div className="image-caption">
            <span>Model output</span>
            <span>{analysisResult ? "Annotated" : "Awaiting analysis"}</span>
          </div>
        </article>

      </div>

      {/* Detection Summary */}
      <section className="summary-block">
        <div className="block-heading">
          <div className="block-heading-icon">
            <ScanSearch size={20} />
          </div>

          <div>
            <h3>Detection Summary</h3>
            <p>
              AI predictions and human verification are separate.
            </p>
          </div>
        </div>

        <div className="detection-metrics">

          <article className="detection-metric">
            <span>AI detections</span>
            <strong>{analysisResult ? detections.length : "—"}</strong>
            <small>No data available</small>
          </article>

          <article className="detection-metric">
            <span>Human-confirmed</span>
            <strong>—</strong>
            <small>No review data available</small>
          </article>

          <article className="detection-metric">
            <span>Analysis status</span>
            <strong className="metric-status">
              Awaiting analysis
            </strong>
            <small>Backend not connected</small>
          </article>

        </div>
      </section>

      {/* Debris Categories */}
      <section className="summary-block">
        <div className="block-heading">
          <div className="block-heading-icon">
            <Waves size={20} />
          </div>

          <div>
            <h3>Debris Categories</h3>
            <p>
              Counts will be populated from actual model and review
              data.
            </p>
          </div>
        </div>

        <div className="category-grid">
          
{categories.map((category) => {
  const count = detections.filter((detection) =>
    category.modelClasses.includes(
      detection.class_name?.trim().toLowerCase()
    )
  ).length;

  return (
    <article
      className={`category-card ${category.className}`}
      key={category.name}
    >
      <div className="category-icon" aria-hidden="true">
        {category.icon}
      </div>

      <div>
        <span>{category.name}</span>
        <strong>{analysisResult ? count : "—"}</strong>
        <small>
          {analysisResult
            ? `${count} AI detection${count === 1 ? "" : "s"}`
            : "No data available"}
        </small>
      </div>
    </article>
  );
})}

        </div>
      </section>

      {/* Detected Objects */}
      <section className="summary-block">
        <div className="block-heading detected-heading">
          <div className="block-heading-icon">
            <ScanSearch size={20} />
          </div>

          <div>
            <h3>Detected Objects</h3>
            <p>
              Individual predictions, model scores, and corrected
              results will appear here.
            </p>
          </div>

          <span className="count-pill">{analysisResult ? `${detections.length} detected` : "No data"}</span>
        </div>

        
{!analysisResult ? (
  <div className="detections-empty">
    <div className="empty-state-icon">
      <ScanSearch size={27} />
    </div>
    <h4>No detection results available</h4>
    <p>
      Run AI analysis through the backend to display detected objects.
      This does not mean the image contains no debris.
    </p>
  </div>
) : detections.length === 0 ? (
  <div className="detections-empty">
    <div className="empty-state-icon">
      <ScanSearch size={27} />
    </div>
    <h4>No objects detected</h4>
    <p>
      The model returned no detections for this image.
    </p>
  </div>
) : (
  <div className="detections-list">
    {detections.map((detection) => (
      <article className="detection-item" key={detection.id}>
        <div>
          <strong>{detection.class_name}</strong>
          <p>
            Confidence: {(detection.confidence * 100).toFixed(1)}%
          </p>
        </div>
        <span className="count-pill">AI detected</span>
      </article>
    ))}
  </div>
)}

      </section>

      {/* Observation Details and Location */}
      <div className="observation-details-grid">

        <section className="details-card">
          <div className="block-heading">
            <div className="block-heading-icon">
              <FileImage size={20} />
            </div>

            <div>
              <h3>Observation Details</h3>
              <p>Information about this observation.</p>
            </div>
          </div>

          <div className="detail-row">
            <CalendarDays size={18} />
            <span>Observation date</span>
            <strong>{observationDate}</strong>
          </div>

          <div className="detail-row">
            <MapPin size={18} />
            <span>Location</span>
            <strong>{analysisResult?.location_name || "Location name unavailable"}
    </strong>
          </div>

          <div className="detail-row">
            <ScanSearch size={18} />
            <span>Location source</span>
            <strong>By user</strong>
          </div>

          <div className="detail-row">
            <ShieldCheck size={18} />
            <span>Verification</span>
            <strong>Pending</strong>
          </div>
        </section>

        <section className="details-card">
          <div className="block-heading">
            <div className="block-heading-icon">
              <MapPin size={20} />
            </div>

            <div>
              <h3>Observation Location</h3>
              <p>Map preview for a known observation site.</p>
            </div>
          </div>

          <div className="map-placeholder">
            <MapPin size={32} />

            <strong>No coordinates available</strong>

            <p>
              A map marker will appear after valid observation
              coordinates are supplied.
            </p>
          </div>

          <button
            type="button"
            className="map-link-button"
            disabled
            title="Available after map integration"
          >
            <MapPin size={17} />
            View on Pollution Map
            <ExternalLink size={15} />
          </button>
        </section>

      </div>

      {/* Footer */}
      <footer className="analysis-footer">
        Aqua Scan · Environmental monitoring prototype ·
        Inspection priority is not a scientific pollution measurement.
      </footer>

    </section>
  );
}
