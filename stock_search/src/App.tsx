import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";

const DataPage = lazy(() =>
  import("./pages/DataPage").then((m) => ({ default: m.DataPage }))
);
const UsagePage = lazy(() =>
  import("./pages/UsagePage").then((m) => ({ default: m.UsagePage }))
);
const AboutPage = lazy(() =>
  import("./pages/AboutPage").then((m) => ({ default: m.AboutPage }))
);
const NotFound = lazy(() =>
  import("./pages/NotFound").then((m) => ({ default: m.NotFound }))
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-base-100 flex flex-col">
        <Navigation />
        <main className="flex-1">
          <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
            <Routes>
              <Route path="/" element={<DataPage />} />
              <Route path="/usage" element={<UsagePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
