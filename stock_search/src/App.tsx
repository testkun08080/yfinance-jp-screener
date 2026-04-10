import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { SecondaryLayout } from "./components/SecondaryLayout";

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
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const ChatPage = lazy(() =>
  import("./pages/ChatPage").then((m) => ({ default: m.ChatPage }))
);

function App() {
  return (
    <Router>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center p-6 text-slate-600">
              読み込み中...
            </div>
          }
        >
          <div className="flex min-h-0 flex-1 flex-col min-w-0">
            <Routes>
              <Route path="/" element={<DataPage />} />
              <Route element={<SecondaryLayout />}>
                <Route path="chat" element={<ChatPage />} />
                <Route path="usage" element={<UsagePage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </div>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
