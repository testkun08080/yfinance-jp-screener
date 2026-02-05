import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AppHeader } from "./components/AppHeader";

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
      <div className="h-screen flex flex-col overflow-hidden bg-white">
        <AppHeader />
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Suspense
            fallback={
              <div className="p-6 text-center text-slate-600">
                読み込み中...
              </div>
            }
          >
            <div className="flex-1 min-h-0 flex flex-col min-w-0">
              <Routes>
                <Route path="/" element={<DataPage />} />
                <Route path="/usage" element={<UsagePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Suspense>
        </div>
      </div>
    </Router>
  );
}

export default App;
