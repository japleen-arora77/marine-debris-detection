import PollutionMapSection from "../components/map/PollutionMapSection";
import { useEffect, useState } from "react";
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

import { verifyAnalysis, updateDetection } from "../services/api";
import "./AnalyzeSection.css";

const API_BASE_URL = "http://127.0.0.1:8000";

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
  // Current analysis data, including any saved edits.
  const [currentAnalysis, setCurrentAnalysis] = useState(analysisResult);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // Update the displayed analysis whenever a new analysis is received.
  useEffect(() => {
    setCurrentAnalysis(analysisResult);
    setEditingId(null);
    setEditForm({});
    setActionError("");
    setActionMessage("");
  }, [analysisResult]);

  const detections = currentAnalysis?.detections ?? [];
  const isVerified =
    currentAnalysis?.verification_status === "verified";

  const observationDate = currentAnalysis?.created_at
    ? new Date(currentAnalysis.created_at).toLocaleString()
    : "Not available";

  // Refresh the annotated image URL after an edit or verification.
  const annotatedImageUrl = currentAnalysis
    ? `${API_BASE_URL}/api/analyses/${currentAnalysis.id}/annotated-image?t=${encodeURIComponent(
        detections
          .map((detection) =>
            `${detection.id}-${detection.class_name}-${detection.x}-${detection.y}-${detection.width}-${detection.height}`
          )
          .join("|")
      )}`
    : null;

  // Confirm the analysis after a human has reviewed it.
  async function handleVerify() {
    if (!currentAnalysis?.id || saving || isVerified) return;

    setSaving(true);
    setActionError("");
    setActionMessage("");

    try {
      const updated = await verifyAnalysis(currentAnalysis.id);
      setCurrentAnalysis(updated);
      setActionMessage("Analysis confirmed and saved successfully.");
    } catch (error) {
      setActionError(
        error.message || "Could not verify this analysis."
      );
    } finally {
      setSaving(false);
    }
  }

  // Open the editing form for one detection.
  function startEditing(detection) {
    if (isVerified || saving) return;

    setEditingId(detection.id);
    setEditForm({
      class_name: detection.class_name,
      confidence: detection.confidence,
      x: detection.x,
      y: detection.y,
      width: detection.width,
      height: detection.height,
    });
    setActionError("");
    setActionMessage("");
  }

  // Save the edited detection to the backend.
  async function handleSaveDetection(detectionId) {
    if (!currentAnalysis?.id || saving) return;

    const className = String(editForm.class_name ?? "").trim();
    const confidence = Number(editForm.confidence);
    const x = Number(editForm.x);
    const y = Number(editForm.y);
    const width = Number(editForm.width);
    const height = Number(editForm.height);

    if (
      !className ||
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 1 ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      width <= 0 ||
      !Number.isFinite(height) ||
      height <= 0
    ) {
      setActionError(
        "Enter a class name, confidence between 0 and 1, and valid bounding-box values."
      );
      return;
    }

    setSaving(true);
    setActionError("");
    setActionMessage("");

    try {
      const updatedDetection = await updateDetection(
        currentAnalysis.id,
        detectionId,
        {
          class_name: className,
          confidence,
          x,
          y,
          width,
          height,
        }
      );

      setCurrentAnalysis((previous) => ({
        ...previous,
        detections: previous.detections.map((detection) =>
          detection.id === detectionId
            ? updatedDetection
            : detection
        ),
      }));

      setEditingId(null);
      setEditForm({});
      setActionMessage("Detection changes saved successfully.");
    } catch (error) {
      setActionError(
        error.message || "Could not save detection changes."
      );
    } finally {
      setSaving(false);
    }
  }

  function cancelEditing() {
    setEditingId(null);
    setEditForm({});
    setActionError("");
    setActionMessage("");
  }

  return (
    <section
    className="analyze-section"
    id="observation-summary"
  >
      {/* Page Heading */}
      <header className="observation-heading">
        <div className="observation-title-group">
          <div className="observation-title-icon">
            <FileImage size={25} />
          </div>

          <div>
            <div className="observation-breadcrumb">
              AquaScan <span>/</span> Detection{" "}
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
          {!currentAnalysis
            ? "Awaiting analysis"
            : isVerified
              ? "Verified"
              : "Pending verification"}
        </span>
      </header>

      {/* Development Notice */}
      <div className="analysis-disclaimer">
        <Info size={19} />
        <p>
          <strong>Review notice:</strong> AI predictions may need
          human correction. Review the detections before confirming
          an observation.
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
                <p>
                  The uploaded image will appear here after analysis.
                </p>
              </>
            )}
          </div>

          <div className="image-caption">
            <span>Source image</span>
            <span>
              {originalImageUrl ? "Uploaded image" : "Awaiting image"}
            </span>
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
                key={annotatedImageUrl}
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
            <span>
              {currentAnalysis ? "Annotated" : "Awaiting analysis"}
            </span>
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
            <strong>
              {currentAnalysis ? detections.length : "—"}
            </strong>
            <small>Predictions returned by the model</small>
          </article>

          <article className="detection-metric">
            <span>Human-confirmed</span>
            <strong>
              {isVerified ? detections.length : "—"}
            </strong>
            <small>
              {isVerified
                ? "Detections in a verified analysis"
                : "Confirm the analysis after reviewing"}
            </small>
          </article>

          <article className="detection-metric">
            <span>Analysis status</span>
            <strong className="metric-status">
              {!currentAnalysis
                ? "Awaiting analysis"
                : isVerified
                  ? "Verified"
                  : "Pending review"}
            </strong>
            <small>
              {isVerified
                ? "Review has been confirmed"
                : "Human review required"}
            </small>
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
              Counts are based on the current detection labels.
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
                  <strong>
                    {currentAnalysis ? count : "—"}
                  </strong>
                  <small>
                    {currentAnalysis
                      ? `${count} detection${count === 1 ? "" : "s"}`
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
              Review model predictions and correct labels or bounding
              boxes before confirming the observation.
            </p>
          </div>

          <span className="count-pill">
            {currentAnalysis
              ? `${detections.length} detected`
              : "No data"}
          </span>
        </div>

        {actionError && (
          <p className="verification-error" role="alert">
            {actionError}
          </p>
        )}

        {actionMessage && (
          <p className="verification-success" role="status">
            {actionMessage}
          </p>
        )}

        {!currentAnalysis ? (
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
                {editingId === detection.id ? (
                  <div className="detection-edit-form">
                    <label>
                      Class name
                      <input
                        type="text"
                        value={editForm.class_name ?? ""}
                        maxLength={100}
                        onChange={(event) =>
                          setEditForm((previous) => ({
                            ...previous,
                            class_name: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label>
                      Confidence (0–1)
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={editForm.confidence ?? ""}
                        onChange={(event) =>
                          setEditForm((previous) => ({
                            ...previous,
                            confidence: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label>
                      X center
                      <input
                        type="number"
                        step="any"
                        value={editForm.x ?? ""}
                        onChange={(event) =>
                          setEditForm((previous) => ({
                            ...previous,
                            x: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label>
                      Y center
                      <input
                        type="number"
                        step="any"
                        value={editForm.y ?? ""}
                        onChange={(event) =>
                          setEditForm((previous) => ({
                            ...previous,
                            y: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label>
                      Bounding-box width
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={editForm.width ?? ""}
                        onChange={(event) =>
                          setEditForm((previous) => ({
                            ...previous,
                            width: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label>
                      Bounding-box height
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={editForm.height ?? ""}
                        onChange={(event) =>
                          setEditForm((previous) => ({
                            ...previous,
                            height: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <div className="detection-edit-actions">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          handleSaveDetection(detection.id)
                        }
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <strong>{detection.class_name}</strong>
                      <p>
                        Confidence:{" "}
                        {(detection.confidence * 100).toFixed(1)}%
                      </p>
                      <span className="count-pill">
                        {isVerified ? "In verified analysis" : "AI detected"}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={saving || isVerified}
                      onClick={() => startEditing(detection)}
                    >
                      Edit Detection
                    </button>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Human Verification */}
      {currentAnalysis && (
        <section className="summary-block verification-actions">
          <div className="block-heading">
            <div className="block-heading-icon">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3>Human Verification</h3>
              <p>
                Review the AI detections above before confirming this
                observation.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={saving || isVerified || editingId !== null}
            onClick={handleVerify}
          >
            <ShieldCheck size={18} />
            {saving
              ? "Saving..."
              : isVerified
                ? "Confirmed & Saved"
                : editingId !== null
                  ? "Save or cancel your edit first"
                  : "Confirm & Save"}
          </button>

          {isVerified && currentAnalysis.verified_at && (
            <p>
              Verified on:{" "}
              {new Date(currentAnalysis.verified_at).toLocaleString()}
            </p>
          )}
        </section>
      )}

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
            <strong>
              {currentAnalysis?.location_name ||
                "Location name unavailable"}
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
            <strong>
              {!currentAnalysis
                ? "Awaiting analysis"
                : isVerified
                  ? "Verified"
                  : "Pending"}
            </strong>
          </div>
        </section>
      
      <PollutionMapSection observations={[]} />
     
      </div>

      {/* Footer */}
      <footer className="analysis-footer">
        AquaScan · Environmental monitoring prototype ·
        Inspection priority is not a scientific pollution measurement.
      </footer>
    </section>
  );
}
