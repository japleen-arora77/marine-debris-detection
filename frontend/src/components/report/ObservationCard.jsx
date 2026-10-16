
import { MapPin, CalendarDays, Package, ArrowUpRight } from "lucide-react";
import { getPriorityClass } from "../../data/reportData";
import "./ObservationCard.css";

export default function ObservationCard({ observation, onClick }) {
  const priorityClass = getPriorityClass(observation.priority);

  const formattedDate = observation.date
    ? new Date(observation.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Date unavailable";

  return (
    <button
      type="button"
      className="report-observation-card"
      onClick={onClick}
      aria-label={`Open report for ${observation.location}`}
    >
      <div className="report-card-image-wrap">
        <img
          className="report-card-image"
          src={observation.image}
          alt={`Observation at ${observation.location}`}
          loading="lazy"
        />

        <span className={`report-priority-badge ${priorityClass}`}>
          <span className="report-priority-dot" />
          {observation.priority} priority
        </span>

        <span className="report-card-open-icon">
          <ArrowUpRight size={18} />
        </span>
      </div>

      <div className="report-card-body">
        <div className="report-card-title-row">
          <div>
            <h3>{observation.location}</h3>
            <p className="report-card-city">{observation.city}</p>
          </div>
        </div>

        <div className="report-card-meta">
          <span>
            <CalendarDays size={15} />
            {formattedDate}
          </span>

          <span>
            <Package size={15} />
            {observation.debrisCount} items
          </span>
        </div>

        <div className="report-card-footer">
          <span className="report-card-location">
            <MapPin size={14} />
            View observation report
          </span>
          <span className="report-card-arrow">
            <ArrowUpRight size={16} />
          </span>
        </div>
      </div>
    </button>
  );
}
