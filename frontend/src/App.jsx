
import { useState } from "react";
import UploadPage from "./pages/UploadPage";
import AnalyzeSection from "./pages/AnalyzeSection";

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState("");

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
    </>
  );
}

export default App;
