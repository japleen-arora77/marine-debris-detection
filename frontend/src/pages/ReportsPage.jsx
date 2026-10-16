
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, FileText, Files, Search, MapPin, ShieldCheck,
  ClipboardList, ArrowUpRight,
} from "lucide-react";

import { getAllAnalyses } from "../services/api";
import { mapAnalysisToObservation } from "../data/reportData";
import ObservationCard from "../components/report/ObservationCard";
import "./ReportsPage.css";

export default function ReportsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredObservations = observations.filter((observation) =>
    `${observation.location} ${observation.city}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const totalDebris = observations.reduce(
    (total, observation) => total + observation.debrisCount,
    0
  );

  const verifiedCount = observations.filter(
    (observation) => observation.verificationStatus === "Verified"
  ).length;

  return (
    <main className="reports-page">
      <header className="reports-topbar">
        <button type="button" className="reports-back-button" onClick={() => navigate("/")}>
          <ArrowLeft size={17} /> Back
        </button>

        <div className="reports-brand">
          <span className="reports-brand-icon"><FileText size={19} /></span>
          <span>AquaScan</span>
          <span className="reports-brand-divider">/</span>
          <span className="reports-brand-current">Reports</span>
        </div>
      </header>

      <section className="reports-hero">
        <div className="reports-hero-copy">
          <span className="reports-eyebrow">
            <ClipboardList size={14} /> REPORT CENTER
          </span>
          <h1>Marine Pollution Reports</h1>
          <p>
            Review observation findings and generate clear reports to support
            marine debris monitoring and environmental assessment.
          </p>
        </div>

        <div className="reports-hero-decoration" aria-hidden="true">
          <div className="reports-decoration-circle circle-one" />
          <div className="reports-decoration-circle circle-two" />
          <FileText size={74} strokeWidth={1.1} />
        </div>
      </section>

      <section className="reports-action-grid">
        <article className="reports-action-card individual-action">
          <div className="reports-action-icon"><FileText size={23} /></div>
          <div className="reports-action-content">
            <span className="reports-action-kicker">SINGLE OBSERVATION</span>
            <h2>Individual Report</h2>
            <p>
              Select an observation to review its image, location, detected
              debris categories, and verification information.
            </p>
            <button
              type="button"
              className="reports-primary-button"
              onClick={() => document.getElementById("observation-selection")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              Choose an observation <ArrowUpRight size={17} />
            </button>
          </div>
          <span className="reports-action-watermark" aria-hidden="true"><FileText size={105} /></span>
        </article>

        <article className="reports-action-card summary-action">
          <div className="reports-action-icon"><Files size={23} /></div>
          <div className="reports-action-content">
            <span className="reports-action-kicker">ALL OBSERVATIONS</span>
            <h2>Summary Report</h2>
            <p>
              Prepare an overview of recorded observations, total debris,
              priority levels, and verification status.
            </p>
            <button type="button" className="reports-secondary-button" onClick={() => navigate("/summary-report")}>
              View summary report <ArrowUpRight size={17} />
            </button>
          </div>
          <span className="reports-action-watermark" aria-hidden="true"><Files size={105} /></span>
        </article>
      </section>

      <section className="reports-stats-grid">
        <article className="reports-stat-card">
          <span className="reports-stat-icon teal"><MapPin size={19} /></span>
          <div><p>Total observations</p><strong>{loading ? "—" : observations.length}</strong></div>
        </article>
        <article className="reports-stat-card">
          <span className="reports-stat-icon blue"><FileText size={19} /></span>
          <div><p>Total debris count</p><strong>{loading ? "—" : totalDebris}</strong></div>
        </article>
        <article className="reports-stat-card">
          <span className="reports-stat-icon green"><ShieldCheck size={19} /></span>
          <div>
            <p>Verified observations</p>
            <strong>{loading ? "—" : `${verifiedCount} / ${observations.length}`}</strong>
          </div>
        </article>
      </section>

      <section className="reports-observations-section" id="observation-selection">
        <div className="reports-section-heading">
          <div>
            <span className="reports-section-eyebrow">INDIVIDUAL REPORTS</span>
            <h2>Select an observation</h2>
            <p>Choose an observation card to open its detailed report.</p>
          </div>
          <span className="reports-results-count">{filteredObservations.length} observations</span>
        </div>

        <div className="reports-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search by beach or city..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search observations by location"
          />
        </div>

        {loading ? (
          <div className="reports-empty-state"><p>Loading observations...</p></div>
        ) : error ? (
          <div className="reports-empty-state"><h3>Could not load reports</h3><p>{error}</p></div>
        ) : filteredObservations.length > 0 ? (
          <div className="reports-observation-grid">
            {filteredObservations.map((observation) => (
              <ObservationCard
                key={observation.id}
                observation={observation}
                onClick={() => navigate(`/individual-report/${observation.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="reports-empty-state">
            <Search size={27} />
            <h3>No observations found</h3>
            <p>{observations.length ? "Try searching with another location name." : "No saved observations are available yet."}</p>
          </div>
        )}
      </section>

      <footer className="reports-footer">
        <span>AquaScan · Marine Debris Detection System</span>
        <span>Data from saved observations</span>
      </footer>
    </main>
  );
}
