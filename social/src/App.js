import "./App.css";
import { Auth, SignUp } from "./pages/Auth/Auth";
import Home from "./pages/Auth/Home/Home";
import Profile from "./pages/Profile/Profile";
import EditProfile from "./pages/Profile/EditProfile";
import Settings from "./pages/Settings/Settings";
import Chat from "./pages/Chat/Chat";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import TechLogo from "./img/fsm-tech.svg";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { clearUserSession, getSessionUserId } from "./utils/session";

const NAV_LINKS = [
  { label: "🏠 Home", path: "/home" },
  { label: "💬 Chat", path: "/chat" },
  { label: "⚙️ Settings", path: "/settings" },
];

const AppTopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = Boolean(getSessionUserId());

  const handleLogout = () => {
    clearUserSession();
    navigate("/");
  };

  return (
    <div className="appTopBar">
      <div className="fsmBrandBadge" onClick={() => navigate(isLoggedIn ? "/home" : "/")} style={{ cursor: "pointer" }}>
        <img src={TechLogo} alt="FSM tech logo" />
        <div className="fsmBrandCopy">
          <strong>Future Social Media</strong>
          <span>Connected feeds. Faster signals. Smarter sharing.</span>
        </div>
        <div className="fsmBrandTag">FSM</div>
      </div>

      {isLoggedIn && (
        <nav className="appNav">
          {NAV_LINKS.map((link) => (
            <button
              key={link.path}
              className={`appNavBtn${location.pathname.startsWith(link.path) ? " activeNav" : ""}`}
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </button>
          ))}
          <button
            className={`appNavBtn${location.pathname.startsWith("/profile") ? " activeNav" : ""}`}
            onClick={() => navigate(`/profile/${getSessionUserId()}`)}
          >
            👤 Profile
          </button>
          <button className="appNavBtn logoutBtn" onClick={handleLogout}>🚪 Logout</button>
        </nav>
      )}
      <div className="fsmBrandGlow" aria-hidden="true" />
    </div>
  );
};

const AppFrame = ({ children }) => (
  <div className="App">
    <div className="blur" style={{ top: "-18%", right: "0" }} />
    <div className="blur" style={{ top: "36%", left: "-8rem" }} />
    <AppTopBar />
    <div className="appContent">{children}</div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="bottom-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        draggable
        theme="colored"
      />
      <Routes>
        <Route path="/" element={<AppFrame><Auth /></AppFrame>} />
        <Route path="/signup" element={<AppFrame><SignUp /></AppFrame>} />
        <Route path="/home" element={<AppFrame><Home /></AppFrame>} />
        <Route path="/profile" element={<AppFrame><Profile /></AppFrame>} />
        <Route path="/profile/edit" element={<AppFrame><EditProfile /></AppFrame>} />
        <Route path="/profile/:id" element={<AppFrame><Profile /></AppFrame>} />
        <Route path="/settings" element={<AppFrame><Settings /></AppFrame>} />
        <Route path="/chat" element={<AppFrame><Chat /></AppFrame>} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
