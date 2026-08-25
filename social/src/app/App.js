import React, { Suspense, lazy } from "react";
import "../theme/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "../components/Navigation/AppLayout";

// Core routes
import Landing from "../pages/Landing/Landing";

// Lazy-loaded routes for optimal initial page load performance
const Auth = lazy(() => import("../pages/Auth/Auth").then(m => ({ default: m.Auth })));
const SignUp = lazy(() => import("../pages/Auth/Auth").then(m => ({ default: m.SignUp })));
const ForgotPassword = lazy(() => import("../pages/Auth/Auth").then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("../pages/Auth/Auth").then(m => ({ default: m.ResetPassword })));
const VerifyEmail = lazy(() => import("../pages/Auth/VerifyEmail"));
const Home = lazy(() => import("../pages/Auth/Home/Home"));
const Profile = lazy(() => import("../pages/Profile/Profile"));
const EditProfile = lazy(() => import("../pages/Profile/EditProfile"));
const Settings = lazy(() => import("../pages/Settings/Settings"));
const Chat = lazy(() => import("../pages/Chat/Chat"));
const Explore = lazy(() => import("../pages/Explore/Explore"));
const Notifications = lazy(() => import("../pages/Notifications/Notifications"));
const Search = lazy(() => import("../pages/Search/Search"));
const SinglePost = lazy(() => import("../pages/SinglePost/SinglePost"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes cache
    }
  }
});

// Warm Editorial Page Loader
const PageLoader = () => (
  <div className="fm-page-loader">
    <div className="fm-spinner" />
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastContainer
          position="bottom-center"
          autoClose={2400}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss={false}
          draggable
          theme="light"
          toastClassName="fm-toast"
        />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify/:token" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            <Route path="/home" element={<AppLayout><Home /></AppLayout>} />
            <Route path="/explore" element={<AppLayout><Explore /></AppLayout>} />
            <Route path="/search" element={<AppLayout><Search /></AppLayout>} />
            <Route path="/notifications" element={<AppLayout><Notifications /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
            <Route path="/profile/edit" element={<AppLayout><EditProfile /></AppLayout>} />
            <Route path="/profile/:username" element={<AppLayout><Profile /></AppLayout>} />
            <Route path="/post/:id" element={<AppLayout><SinglePost /></AppLayout>} />
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
