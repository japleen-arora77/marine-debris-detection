

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
  {
    name: "Plastic",
    icon: "♧",
    className: "plastic",
  },
  {
    name: "Metal",
    icon: "▤",
    className: "metal",
  },
  {
    name: "Fishing net",
    icon: "⌘",
    className: "fishing",
  },
  {
    name: "Other debris",
    icon: "◇",
    className: "other",
  },
];

export default function AnalyzeSection() {
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
            <FileImage size={38} />

            <strong>Original image preview</strong>

            <p>
              The image selected on the upload page will appear here.
            </p>
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
            <ScanSearch size={38} />

            <strong>Annotated image preview</strong>

            <p>
              The backend-provided annotated image will appear here
              when available.
            </p>
          </div>

          <div className="image-caption">
            <span>Model output</span>
            <span>Not generated</span>
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
            <strong>—</strong>
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
          {categories.map((category) => (
            <article
              className={`category-card ${category.className}`}
              key={category.name}
            >
              <div className="category-icon" aria-hidden="true">
                {category.icon}
              </div>

              <div>
                <span>{category.name}</span>
                <strong>—</strong>
                <small>No data available</small>
              </div>
            </article>
          ))}
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

          <span className="count-pill">No data</span>
        </div>

        <div className="detections-empty">
          <div className="empty-state-icon">
            <ScanSearch size={27} />
          </div>

          <h4>No detection results available</h4>

          <p>
            Run AI analysis through the backend to display detected
            objects. This does not mean the image contains no debris.
          </p>
        </div>
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
            <strong>Not available</strong>
          </div>

          <div className="detail-row">
            <MapPin size={18} />
            <span>Location</span>
            <strong>Location unknown</strong>
          </div>

          <div className="detail-row">
            <ScanSearch size={18} />
            <span>Location source</span>
            <strong>Not available</strong>
          </div>

          <div className="detail-row">
            <ShieldCheck size={18} />
            <span>Verification</span>
            <strong>Not reviewed</strong>
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
