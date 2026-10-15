
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

export async function verifyAnalysis(analysisId) {
  const response = await fetch(
    `${API_BASE_URL}/api/analyses/${analysisId}/verify`,
    { method: "POST" }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || `Verification failed with status ${response.status}.`
    );
  }

  return data;
}

export async function updateDetection(analysisId, detectionId, updates) {
  const response = await fetch(
    `${API_BASE_URL}/api/analyses/${analysisId}/detections/${detectionId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || `Updating detection failed with status ${response.status}.`
    );
  }

  return data;
}
