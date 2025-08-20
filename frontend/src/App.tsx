import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { ToastContainer } from 'react-toastify';
import { ThemeProvider } from "./components/theme-provider";
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { AuthPage } from './pages/AuthPage';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <ThemeProvider>
      <DynamicContextProvider
      settings={{
        environmentId: import.meta.env.VITE_ENVIRONMENT_ID,
        walletConnectors: [EthereumWalletConnectors],
      }}
      >
      <Router>
        <Routes>
          <Route
          path="/auth"
          element={
            <PublicRoute>
            <AuthPage />
            </PublicRoute>
          }
          />
          <Route
          path="/"
          element={
            <ProtectedRoute>
            <Layout />
            </ProtectedRoute>
          }
          >
          <Route index element={<Home />} />
          <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        className="mt-16"
      />
      </DynamicContextProvider>
    </ThemeProvider>
  );
}

export default App;
