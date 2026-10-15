
const API_BASE_URL = "http://127.0.0.1:8000";

export async function analyzeImage(file, location) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("latitude", String(location.latitude));
  formData.append("longitude", String(location.longitude));
  formData.append("location_name", location.name || "");
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || `Analysis failed with status ${response.status}.`
    );
  }

  return data;
}
