
import { useState } from "react";
import {
  Waves,
  ScanSearch,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
  Pencil,
  CheckCircle2,
  Info,
} from "lucide-react";
import "./AnalyzeSection.css";

export default function AnalyzeSection() {
  const [reviewStatus, setReviewStatus] = useState("Pending");

  return (
    <section className="analyze-section" id="analyze-section">
      <header className="analyze-header">
        <div className="analyze-brand">
          <span className="analyze-brand-icon">
            <Waves size={23} />
          </span>

          <div>
            <p className="analyze-kicker">AQUA SCAN</p>
            <h2>Marine Debris Analysis</h2>
            <p className="analyze-subtitle">
              Review image analysis and observation details.
            </p>
          </div>
        </div>

        <span className="analyze-status">
          <span className="analyze-status-dot" />
          {reviewStatus === "Pending"
            ? "Awaiting analysis"
            : reviewStatus}
        </span>
      </header>

      <div className="analyze-notice">
        <Info size={19} />
        <p>
          <strong>Development preview:</strong> AI analysis is not
          connected yet. No actual detections are being displayed.
        </p>
      </div>

      <div className="analyze-image-area">
        <div className="analyze-image-heading">
          <div>
            <h3>Analyzed Image</h3>
            <p>Your annotated image will appear here.</p>
          </div>

          <span className="image-type-label">
            <ImageIcon size={15} />
            Image preview
          </span>
        </div>

        <div className="analyze-image-placeholder">
          <div className="placeholder-icon">
            <ScanSearch size={38} />
          </div>

          <h3>Ready for AI analysis</h3>

          <p>
            Connect the backend to display the uploaded image,
            detected objects, and real bounding boxes here.
          </p>
        </div>
      </div>

      <div className="analyze-metrics">
        <article className="analyze-metric-card">
          <span>AI detections</span>
          <strong>Not available</strong>
          <small>Waiting for backend</small>
        </article>

        <article className="analyze-metric-card">
          <span>Categories</span>
          <strong>Not available</strong>
          <small>Waiting for backend</small>
        </article>

        <article className="analyze-metric-card">
          <span>Review status</span>
          <strong>{reviewStatus}</strong>
          <small>Human verification</small>
        </article>
      </div>

      <div className="detected-objects-panel">
        <div className="detected-panel-heading">
          <div>
            <h3>Detected Objects</h3>
            <p>AI predictions will be listed here after analysis.</p>
          </div>

          <span className="object-count">0 objects</span>
        </div>

        <div className="no-detections">
          <ScanSearch size={27} />
          <strong>No results available</strong>
          <p>
            Analysis has not run yet. This does not mean that the
            image contains no marine debris.
          </p>
        </div>
      </div>

      <div className="analyze-location-card">
        <div className="location-card-icon">
          <MapPin size={21} />
        </div>

        <div>
          <h3>Observation Location</h3>
          <p>Location will be shared from the upload section later.</p>
          <span>Location not connected</span>
        </div>
      </div>

      <div className="analyze-review-actions">
        <div className="review-help">
          <ShieldCheck size={20} />
          <span>Human verification is separate from AI prediction.</span>
        </div>

        <div className="review-buttons">
          <button
            type="button"
            className="review-button secondary"
            onClick={() => setReviewStatus("Pending")}
          >
            <Pencil size={17} />
            Reset review
          </button>

          <button
            type="button"
            className="review-button primary"
            onClick={() =>
              setReviewStatus("Ready for review")
            }
          >
            <CheckCircle2 size={17} />
            Prepare review
          </button>
        </div>
      </div>

      <p className="analyze-footer-note">
        Aqua Scan is an environmental monitoring prototype.
        Detection results require backend analysis and human review.
      </p>
    </section>
  );
}
