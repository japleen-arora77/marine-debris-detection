
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Package,
  ShieldCheck,
  AlertTriangle,
  FileDown,
  Waves,
  CheckCircle2,
  Clock3,
  ExternalLink,
} from "lucide-react";

import {
  getAnalysis,
  getOriginalImageUrl,
  getAnnotatedImageUrl,
} from "../services/api";

import {
  mapAnalysisToObservation,
  getPriorityClass,
} from "../data/reportData";

import "./IndividualReportPage.css";

export default function IndividualReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [observation, setObservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    getAnalysis(id)
      .then((data) => {
        if (!cancelled) {
          setObservation(mapAnalysisToObservation(data));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load report.");
          setObservation(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Not available";
    }

    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleExportPDF = () => window.print();

  if (loading) {
    return (
      <main className="individual-report-page">
        <div className="individual-report-empty">
          <p>Loading report...</p>
        </div>
      </main>
    );
  }

  if (!observation || error) {
    return (
      <main className="individual-report-page">
        <div className="individual-report-empty">
          <AlertTriangle size={42} />
          <h2>Report not found</h2>
          <p>
            {error ||
              `We couldn't find an observation with ID ${id}.`}
          </p>
          <button
            className="ir-primary-button"
            onClick={() => navigate("/reports")}
          >
            <ArrowLeft size={17} /> Back to Reports
          </button>
        </div>
      </main>
    );
  }

  const priorityClass = getPriorityClass(observation.priority);
  const totalCategories = observation.categories.length;

  const categoryTotal = observation.categories.reduce(
    (sum, category) => sum + category.count,
    0
  );

  return (
    <main className="individual-report-page">
      <div className="ir-container">
        <div className="ir-topbar">
          <button
            className="ir-back-button"
            onClick={() => navigate("/reports")}
          >
            <ArrowLeft size={18} /> Back to Reports
          </button>

          <button
            className="ir-export-button"
            onClick={handleExportPDF}
          >
            <FileDown size={18} /> Export PDF
          </button>
        </div>

        <section className="ir-report-heading">
          <div className="ir-heading-icon">
            <Waves size={25} />
          </div>

          <div className="ir-heading-copy">
            <span className="ir-eyebrow">
              AquaScan · OBSERVATION REPORT
            </span>
            <h1>{observation.location}</h1>
            <p>
              <MapPin size={16} /> {observation.city}
            </p>
          </div>

          <div className="ir-report-id">
            <span>REPORT ID</span>
            <strong>
              AS-{String(observation.id).padStart(4, "0")}
            </strong>
          </div>
        </section>

        <section className="ir-stats-grid">
          <article className="ir-stat-card">
            <span className="ir-stat-icon blue">
              <Package size={20} />
            </span>
            <span className="ir-stat-label">Total debris items</span>
            <strong>{observation.debrisCount}</strong>
            <small>Saved detection records</small>
          </article>

          <article className="ir-stat-card">
            <span className="ir-stat-icon teal">
              <Waves size={20} />
            </span>
            <span className="ir-stat-label">Debris categories</span>
            <strong>{totalCategories}</strong>
            <small>Distinct predicted categories</small>
          </article>

          <article className="ir-stat-card">
            <span className="ir-stat-icon amber">
              <AlertTriangle size={20} />
            </span>
            <span className="ir-stat-label">Priority</span>
            <strong className={`ir-priority-text ${priorityClass}`}>
              {observation.priority}
            </strong>
            <small>Based on detection count</small>
          </article>

          <article className="ir-stat-card">
            <span className="ir-stat-icon green">
              {observation.verificationStatus === "Verified" ? (
                <ShieldCheck size={20} />
              ) : (
                <Clock3 size={20} />
              )}
            </span>
            <span className="ir-stat-label">Verification</span>
            <strong className="ir-verification-value">
              {observation.verificationStatus}
            </strong>
            <small>Saved record status</small>
          </article>
        </section>

        <section className="ir-content-grid">
          <article className="ir-panel ir-observation-panel">
            <div className="ir-panel-heading">
              <div>
                <span className="ir-section-kicker">FIELD RECORD</span>
                <h2>Observation details</h2>
              </div>
              <CalendarDays size={21} />
            </div>

            {/* Original uploaded image */}
            <div className="ir-observation-image-wrap">
              <img
                src={getOriginalImageUrl(observation.id)}
                alt={`Original observation at ${observation.location}`}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <span className="ir-image-caption">
                Original uploaded image
              </span>
            </div>

            {/* AI-annotated image */}
            <div className="ir-observation-image-wrap ir-annotated-image-wrap">
              <img
                src={getAnnotatedImageUrl(observation.id)}
                alt={`AI-annotated debris detection at ${observation.location}`}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <span className="ir-image-caption">
                AI-annotated image — detected objects and bounding boxes
              </span>
            </div>

            <div className="ir-detail-row">
              <span>Observation location</span>
              <strong>{observation.location}</strong>
            </div>

            <div className="ir-detail-row">
              <span>City / Region</span>
              <strong>{observation.city}</strong>
            </div>

            <div className="ir-detail-row">
              <span>Date and time</span>
              <strong>{formatDate(observation.date)}</strong>
            </div>

            <div className="ir-detail-row">
              <span>Latitude</span>
              <strong>
                {observation.latitude == null
                  ? "Not provided"
                  : `${Number(observation.latitude).toFixed(4)}°`}
              </strong>
            </div>

            <div className="ir-detail-row">
              <span>Longitude</span>
              <strong>
                {observation.longitude == null
                  ? "Not provided"
                  : `${Number(observation.longitude).toFixed(4)}°`}
              </strong>
            </div>

            {observation.latitude != null &&
              observation.longitude != null && (
                <a
                  className="ir-map-link"
                  href={`https://www.google.com/maps?q=${observation.latitude},${observation.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin size={17} />
                  View coordinates on map
                  <ExternalLink size={15} />
                </a>
              )}
          </article>

          <div className="ir-right-column">
            <article className="ir-panel">
              <div className="ir-panel-heading">
                <div>
                  <span className="ir-section-kicker">AI ANALYSIS</span>
                  <h2>Debris breakdown</h2>
                </div>
                <Package size={21} />
              </div>

              <p className="ir-panel-description">
                Detection counts grouped by the AI-predicted category.
              </p>

              {observation.categories.length ? (
                <div className="ir-category-list">
                  {observation.categories.map((category, index) => {
                    const percentage = observation.debrisCount
                      ? Math.round(
                          (category.count / observation.debrisCount) * 100
                        )
                      : 0;

                    return (
                      <div
                        className="ir-category-item"
                        key={category.name}
                      >
                        <div className="ir-category-top">
                          <span>
                            <span
                              className={`ir-category-dot dot-${index % 4}`}
                            />
                            {category.name}
                          </span>

                          <strong>
                            {category.count}
                            <small> items</small>
                          </strong>
                        </div>

                        <div
                          className="ir-progress-track"
                          role="progressbar"
                          aria-label={`${category.name} share`}
                          aria-valuenow={percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className={`ir-progress-fill fill-${index % 4}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        <span className="ir-category-percentage">
                          {percentage}% of detections
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="ir-panel-description">
                  No debris detections were recorded for this observation.
                </p>
              )}

              <div className="ir-category-total">
                <span>Total items in record</span>
                <strong>{categoryTotal}</strong>
              </div>
            </article>

            <article className="ir-panel">
              <div className="ir-panel-heading">
                <div>
                  <span className="ir-section-kicker">RECORD NOTES</span>
                  <h2>Observation summary</h2>
                </div>
                <CheckCircle2 size={21} />
              </div>

              <p className="ir-summary-text">
                {observation.debrisCount
                  ? `${observation.debrisCount} debris detection(s) were recorded by the AI model for this image. The categories above reflect the saved detection records.`
                  : "No debris detections were recorded for this image."}
              </p>

              <div className="ir-recommendation">
                <strong>Recommended follow-up</strong>
                <ul>
                  <li>
                    Review the original observation image and recorded
                    categories.
                  </li>
                  <li>
                    Confirm the location and reported detections through
                    field verification.
                  </li>
                  <li>
                    Record a follow-up observation after cleanup or
                    monitoring, if applicable.
                  </li>
                </ul>
              </div>
            </article>
          </div>
        </section>

        <footer className="ir-report-footer">
          <div>
            <Waves size={20} />
            <span>
              <strong>AquaScan</strong>
              <small>
                AI-assisted marine debris monitoring prototype
              </small>
            </span>
          </div>

          <p>
            Report AS-{String(observation.id).padStart(4, "0")}
          </p>
        </footer>
      </div>
    </main>
  );
}
