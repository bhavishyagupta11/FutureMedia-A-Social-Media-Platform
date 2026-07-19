import React, { Suspense, lazy } from "react";
import "../theme/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "../components/Navigation/AppLayout";

// Lazy load routes for performance
const { Auth, SignUp, ForgotPassword, ResetPassword } = require("../pages/Auth/Auth");
const Home = lazy(() => import("../pages/Auth/Home/Home"));
const Profile = lazy(() => import("../pages/Profile/Profile"));
const EditProfile = lazy(() => import("../pages/Profile/EditProfile"));
const Settings = lazy(() => import("../pages/Settings/Settings"));
const Chat = lazy(() => import("../pages/Chat/Chat"));
const Explore = lazy(() => import("../pages/Explore/Explore"));
const Notifications = lazy(() => import("../pages/Notifications/Notifications"));
const Search = lazy(() => import("../pages/Search/Search"));

const queryClient = new QueryClient();

// Simple loading fallback
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div className="loader" style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastContainer
          position="bottom-center"
          autoClose={2500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss={false}
          draggable
          theme="dark"
          toastClassName="glass-card"
        />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            <Route path="/home" element={<AppLayout><Home /></AppLayout>} />
            <Route path="/explore" element={<AppLayout><Explore /></AppLayout>} />
            <Route path="/search" element={<AppLayout><Search /></AppLayout>} />
            <Route path="/notifications" element={<AppLayout><Notifications /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
            <Route path="/profile/edit" element={<AppLayout><EditProfile /></AppLayout>} />
            <Route path="/profile/:id" element={<AppLayout><Profile /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
            <Route path="/messages" element={<AppLayout><Chat /></AppLayout>} />
            <Route path="/chat" element={<Navigate to="/messages" replace />} />
            
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
