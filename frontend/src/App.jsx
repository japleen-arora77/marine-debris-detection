
import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import UploadPage from "./pages/UploadPage";
import AnalyzeSection from "./pages/AnalyzeSection";
import PollutionMapPage from "./pages/PollutionMapPage";

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState("");

  return (
    <Routes>
      <Route
        path="/"
        element={
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
          </>
        }
      />

      <Route
        path="/pollution-map"
        element={<PollutionMapPage />}
      />
    </Routes>
  );
}

export default App;
