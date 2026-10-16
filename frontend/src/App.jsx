import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { FileText, ArrowUpRight } from "lucide-react";

import UploadPage from "./pages/UploadPage";
import AnalyzeSection from "./pages/AnalyzeSection";
import PollutionMapPage from "./pages/PollutionMapPage";
import ReportsPage from "./pages/ReportsPage";
import IndividualReportPage from "./pages/IndividualReportPage";
import SummaryReportPage from "./pages/SummaryReportPage";

function MainPage({ analysisResult, setAnalysisResult, originalImageUrl, setOriginalImageUrl }) {
  const navigate = useNavigate();

  return (
    <>
      <UploadPage
        onAnalysisComplete={(result, imageUrl) => {
          setAnalysisResult(result);
          setOriginalImageUrl(imageUrl);
        }}
      />

      <AnalyzeSection
        analysisResult={analysisResult}
        originalImageUrl={originalImageUrl}
      />

      <button
        type="button"
        className="reports-floating-button"
        onClick={() => navigate("/reports")}
        aria-label="Open reports page"
      >
        <span className="reports-floating-icon">
          <FileText size={21} />
        </span>

        <span className="reports-floating-text">
          <strong>View Reports</strong>
          <small>Explore observation reports</small>
        </span>

        <ArrowUpRight size={19} className="reports-floating-arrow" />
      </button>
    </>
  );
}

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState("");

  return (
    <Routes>
      <Route
        path="/"
        element={
          <MainPage
            analysisResult={analysisResult}
            setAnalysisResult={setAnalysisResult}
            originalImageUrl={originalImageUrl}
            setOriginalImageUrl={setOriginalImageUrl}
          />
        }
      />

      <Route
        path="/pollution-map"
        element={<PollutionMapPage />}
      />

      <Route
        path="/reports"
        element={<ReportsPage />}
      />
      <Route
  path="/individual-report/:id"
  element={<IndividualReportPage />}
/>
<Route
  path="/summary-report"
  element={<SummaryReportPage />}
/>
    </Routes>
  );
}

export default App;