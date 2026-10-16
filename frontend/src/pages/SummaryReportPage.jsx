
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, FileDown, Waves, MapPin, Package, ClipboardList,
  ShieldCheck, Clock3, AlertTriangle, CalendarDays, ArrowUpRight,
  ChartNoAxesCombined,
} from "lucide-react";

import { getAllAnalyses } from "../services/api";
import { mapAnalysisToObservation } from "../data/reportData";
import "./SummaryReportPage.css";

export default function SummaryReportPage() {
  const navigate = useNavigate();
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getAllAnalyses()
      .then((data) => {
        if (!cancelled) {
          setObservations(data.map(mapAnalysisToObservation));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const totalItems = observations.reduce(
      (sum, item) => sum + item.debrisCount, 0
    );

    const categoryTotals = {};
    observations.forEach((observation) => {
      observation.categories.forEach((category) => {
        categoryTotals[category.name] =
          (categoryTotals[category.name] || 0) + category.count;
      });
    });

    const categories = Object.entries(categoryTotals)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const priorityCounts = {
      High: observations.filter((item) => item.priority === "High").length,
      Medium: observations.filter((item) => item.priority === "Medium").length,
      Low: observations.filter((item) => item.priority === "Low").length,
    };

    const verifiedCount = observations.filter(
      (item) => item.verificationStatus === "Verified"
    ).length;

    const datedObservations = observations.filter(
      (item) => item.date && !Number.isNaN(new Date(item.date).getTime())
    );

    const latestDate = datedObservations.length
      ? datedObservations.reduce((latest, item) =>
          new Date(item.date) > new Date(latest) ? item.date : latest,
        datedObservations[0].date)
      : null;

    return {
      totalItems,
      categories,
      priorityCounts,
      verifiedCount,
      pendingCount: observations.length - verifiedCount,
      locationCount: new Set(
        observations.map((item) => item.location)
      ).size,
      latestDate,
    };
  }, [observations]);

  const maxCategoryCount = Math.max(
    ...summary.categories.map((category) => category.count),
    1
  );

  const formatDate = (date) => {
    if (!date) return "Not available";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? "Not available"
      : parsed.toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
        });
  };

  const formatDateTime = (date) => {
    if (!date) return "Not available";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? "Not available"
      : parsed.toLocaleString("en-IN", {
          day: "2-digit", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        });
  };

  if (loading) {
    return (
      <main className="summary-report-page">
        <div className="sr-container">
          <p>Loading summary report...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="summary-report-page">
        <div className="sr-container">
          <div className="sr-topbar">
            <button className="sr-back-button" onClick={() => navigate("/reports")}>
              <ArrowLeft size={18} /> Back to Reports
            </button>
          </div>
          <div className="sr-panel">
            <h2>Could not load summary report</h2>
            <p>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="summary-report-page">
      <div className="sr-container">
        <div className="sr-topbar">
          <button
            type="button"
            className="sr-back-button"
            onClick={() => navigate("/reports")}
          >
            <ArrowLeft size={18} /> Back to Reports
          </button>
          <button
            type="button"
            className="sr-export-button"
            onClick={() => window.print()}
          >
            <FileDown size={18} /> Export PDF
          </button>
        </div>

        <section className="sr-hero">
          <div className="sr-hero-content">
            <span className="sr-eyebrow">AQUA SCAN / MONITORING OVERVIEW</span>
            <h1>Marine Debris Summary Report</h1>
            <p>
              An aggregated overview of saved observations, reported debris
              categories, locations, and verification status.
            </p>
            <div className="sr-hero-meta">
              <span><CalendarDays size={15} /> Latest observation: {formatDate(summary.latestDate)}</span>
              <span><ClipboardList size={15} /> {observations.length} records</span>
            </div>
          </div>
          <div className="sr-hero-icon">
            <Waves size={46} />
            <ChartNoAxesCombined size={25} />
          </div>
        </section>

        <div className="sr-demo-notice">
          <AlertTriangle size={19} />
          <div>
            <strong>AI-assisted observation data</strong>
            <p>
              Statistics are calculated from saved AI detection records.
              They represent model predictions and verification status,
              not independently confirmed environmental measurements.
            </p>
          </div>
        </div>

        <section className="sr-stats-grid">
          <article className="sr-stat-card">
            <span className="sr-stat-icon blue"><ClipboardList size={21} /></span>
            <span className="sr-stat-label">Total observations</span>
            <strong>{observations.length}</strong>
            <small>Saved analysis records</small>
          </article>
          <article className="sr-stat-card">
            <span className="sr-stat-icon teal"><Package size={21} /></span>
            <span className="sr-stat-label">Reported debris items</span>
            <strong>{summary.totalItems}</strong>
            <small>Total saved detections</small>
          </article>
          <article className="sr-stat-card">
            <span className="sr-stat-icon purple"><MapPin size={21} /></span>
            <span className="sr-stat-label">Locations covered</span>
            <strong>{summary.locationCount}</strong>
            <small>Distinct location labels</small>
          </article>
          <article className="sr-stat-card">
            <span className="sr-stat-icon amber"><Clock3 size={21} /></span>
            <span className="sr-stat-label">Pending verification</span>
            <strong>{summary.pendingCount}</strong>
            <small>Records marked pending</small>
          </article>
        </section>

        <section className="sr-analysis-grid">
          <article className="sr-panel">
            <div className="sr-panel-heading">
              <div>
                <span className="sr-section-kicker">CATEGORY ANALYSIS</span>
                <h2>Debris category breakdown</h2>
              </div>
              <Package size={21} />
            </div>
            <p className="sr-description">
              Detection counts grouped by category across all saved observations.
            </p>

            {summary.categories.length ? (
              <div className="sr-category-list">
                {summary.categories.map((category, index) => (
                  <div className="sr-category-item" key={category.name}>
                    <div className="sr-category-heading">
                      <span>
                        <span className={`sr-dot sr-dot-${index % 4}`} />
                        {category.name}
                      </span>
                      <strong>{category.count} items</strong>
                    </div>
                    <div className="sr-track">
                      <div
                        className={`sr-bar sr-bar-${index % 4}`}
                        style={{
                          width: `${(category.count / maxCategoryCount) * 100}%`,
                        }}
                      />
                    </div>
                    <small>
                      {summary.totalItems
                        ? Math.round(category.count / summary.totalItems * 100)
                        : 0}% of detections
                    </small>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sr-empty">No category data available.</p>
            )}
          </article>

          <article className="sr-panel">
            <div className="sr-panel-heading">
              <div>
                <span className="sr-section-kicker">REVIEW STATUS</span>
                <h2>Verification overview</h2>
              </div>
              <ShieldCheck size={21} />
            </div>
            <p className="sr-description">
              Current verification status of the saved observation records.
            </p>

            <div className="sr-verification-total">
              <div>
                <span className="sr-verification-label">Verified records</span>
                <strong>{summary.verifiedCount}</strong>
              </div>
              <div className="sr-verified-icon"><ShieldCheck size={24} /></div>
            </div>

            <div className="sr-status-row">
              <span><span className="sr-status-dot verified" />Verified</span>
              <strong>{summary.verifiedCount}</strong>
            </div>
            <div className="sr-status-row">
              <span><span className="sr-status-dot pending" />Pending verification</span>
              <strong>{summary.pendingCount}</strong>
            </div>

            <div className="sr-status-track">
              <div
                className="sr-status-verified-bar"
                style={{
                  width: `${observations.length
                    ? summary.verifiedCount / observations.length * 100
                    : 0}%`,
                }}
              />
            </div>

            <div className="sr-priority-divider" />
            <h3 className="sr-subheading">Priority distribution</h3>

            {Object.entries(summary.priorityCounts).map(([priority, count]) => (
              <div className="sr-priority-row" key={priority}>
                <span className={`sr-priority-pill ${priority.toLowerCase()}`}>{priority}</span>
                <div className="sr-priority-track">
                  <div
                    className={`sr-priority-bar ${priority.toLowerCase()}`}
                    style={{
                      width: `${observations.length
                        ? count / observations.length * 100
                        : 0}%`,
                    }}
                  />
                </div>
                <strong>{count}</strong>
              </div>
            ))}
            <p className="sr-priority-footnote">
              Priority is calculated from detection count: High 20+, Medium 8–19, Low 0–7.
            </p>
          </article>
        </section>

        <section className="sr-panel sr-locations-panel">
          <div className="sr-panel-heading sr-locations-heading">
            <div>
              <span className="sr-section-kicker">OBSERVATION REGISTER</span>
              <h2>Location-wise summary</h2>
              <p className="sr-description">
                Select a record to open its individual observation report.
              </p>
            </div>
            <MapPin size={22} />
          </div>

          <div className="sr-table-wrap">
            <table className="sr-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Observation date</th>
                  <th>Debris items</th>
                  <th>Priority</th>
                  <th>Verification</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {observations
                  .slice()
                  .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
                  .map((observation) => (
                    <tr key={observation.id}>
                      <td>
                        <strong>{observation.location}</strong>
                        <small>{observation.city}</small>
                      </td>
                      <td>{formatDate(observation.date)}</td>
                      <td><span className="sr-item-count">{observation.debrisCount}</span></td>
                      <td>
                        <span className={`sr-priority-pill ${observation.priority.toLowerCase()}`}>
                          {observation.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`sr-verification-pill ${
                          observation.verificationStatus === "Verified" ? "verified" : "pending"
                        }`}>
                          {observation.verificationStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          className="sr-open-report"
                          onClick={() => navigate(`/individual-report/${observation.id}`)}
                          aria-label={`Open ${observation.location} report`}
                        >
                          View <ArrowUpRight size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="sr-recommendation-panel">
          <div className="sr-recommendation-icon"><Waves size={23} /></div>
          <div>
            <h2>Suggested next steps</h2>
            <ul>
              <li>Review pending records before treating their detections as confirmed.</li>
              <li>Inspect individual reports for the saved categories and location details.</li>
              <li>Compare future observations over time as additional records are collected.</li>
            </ul>
          </div>
        </section>

        <footer className="sr-footer">
          <div>
            <Waves size={20} />
            <span>
              <strong>Aqua Scan</strong>
              <small>AI-assisted marine debris monitoring prototype</small>
            </span>
          </div>
          <span>Summary of {observations.length} saved records · Generated {formatDateTime(new Date())}</span>
        </footer>
      </div>
    </main>
  );
}
