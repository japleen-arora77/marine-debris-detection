
import {
  getOriginalImageUrl,
  getAnnotatedImageUrl,
} from "../services/api";

export const getPriorityClass = (priority) => {
  switch (String(priority || "").toLowerCase()) {
    case "high":
      return "high";
    case "medium":
      return "medium";
    default:
      return "low";
  }
};

// Convert actual backend analysis data into the format
// expected by the report components.
export const mapAnalysisToObservation = (analysis) => {
  const detections = Array.isArray(analysis.detections)
    ? analysis.detections
    : [];

  // Count detections by their predicted category.
  const categoryCounts = {};

  detections.forEach((detection) => {
    const category = detection.class_name || "Other";

    categoryCounts[category] =
      (categoryCounts[category] || 0) + 1;
  });

  const categories = Object.entries(categoryCounts)
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const debrisCount = detections.length;

  let priority = "Low";

  if (debrisCount >= 20) {
    priority = "High";
  } else if (debrisCount >= 8) {
    priority = "Medium";
  }

  const location =
    analysis.location_name?.trim() ||
    `Observation #${analysis.id}`;

  const verificationStatus =
    analysis.verification_status === "verified"
      ? "Verified"
      : "Pending verification";

  return {
    id: analysis.id,
    location,
    city: "Location details not provided",

    latitude: analysis.latitude,
    longitude: analysis.longitude,
    date: analysis.created_at,

    debrisCount,
    priority,
    verificationStatus,
    categories,

    // Existing backend image endpoints.
    image: getOriginalImageUrl(analysis.id),
    annotatedImage: getAnnotatedImageUrl(analysis.id),

    summary:
      debrisCount > 0
        ? `${debrisCount} debris detections were identified in this analysis. The most frequently detected category is ${
            categories[0]?.name || "Other"
          }.`
        : "No debris detections were recorded for this analysis.",

    modelId: analysis.model_id,
    filename: analysis.filename,
  };
};
