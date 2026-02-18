import React from "react";
import { BrowserRouter as Router } from "react-router-dom";

// --- CONTEXTS ---
import { ConfigProvider } from "./contexts/ConfigContext";
import { MarketProvider } from "./contexts/MarketContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ChatProvider } from "./pages/chat/ChatContext";
import { ToastProvider } from "./contexts/ToastContext";

// --- COMPONENTS ---
import { GhostBar } from "./pages/home/components/GhostBar";
import { AppRoutes } from "./routes/AppRoutes";

const App = () => (
  <ToastProvider>
    <ConfigProvider>
      <AuthProvider>
        <MarketProvider>
          <ChatProvider>
            <Router>
              <GhostBar />
              <AppRoutes />
            </Router>
          </ChatProvider>
        </MarketProvider>
      </AuthProvider>
    </ConfigProvider>
  </ToastProvider>
);

export default App;
