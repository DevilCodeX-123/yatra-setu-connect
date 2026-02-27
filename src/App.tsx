import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider, useTranslation } from "./contexts/LanguageContext";
import Index from "./pages/Index";
import Booking from "./pages/Booking";
import VerifyTicket from "./pages/VerifyTicket";
import PassengerDashboard from "./pages/PassengerDashboard";
import DriverPanel from "./pages/DriverPanel";
import EmployeePanel from "./pages/EmployeePanel";
import OwnerPanel from "./pages/OwnerPanel";
import AdminPanel from "./pages/AdminPanel";
import SchoolBus from "./pages/SchoolBus";
import Emergency from "./pages/Emergency";
import Transactions from "./pages/Transactions";
import Buses from "./pages/Buses";
import Profile from "./pages/Profile";
import ProfileBookings from "./pages/ProfileBookings";
import ProfileInfo from "./pages/ProfileInfo";
import ProfilePassengers from "./pages/ProfilePassengers";
import ProfileWallet from "./pages/ProfileWallet";
import ProfilePlaceholder from "./pages/ProfilePlaceholder";
import ProfilePastRides from "./pages/ProfilePastRides";
import Support from "./pages/Support";
import BusTracking from "./pages/BusTracking";
import Login from "./pages/Login";
import RouteSelection from "./pages/RouteSelection";
import NotFound from "./pages/NotFound";
import OrganizationTracking from "./pages/OrganizationTracking";
import SplashLoader from "@/components/brand/SplashLoader";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

// ─── Protected Route: Auth required ──────────────────────────────────────────
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isVerifying } = useAuth();
  const hasLocalToken = !!localStorage.getItem("ys_token");
  if (isVerifying) return <SplashLoader />;
  if (!isAuthenticated && !hasLocalToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ─── Role Guard: Require specific role(s) ────────────────────────────────────
const RoleRoute = ({ children, roles }: { children: React.ReactNode; roles: string[] }) => {
  const { isAuthenticated, isVerifying, role } = useAuth();
  const hasLocalToken = !!localStorage.getItem("ys_token");
  if (isVerifying) return <SplashLoader />;
  if (!isAuthenticated && !hasLocalToken) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppShell = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const noSidebarRoutes = ["/login", "/404"];
  const showSidebar = isAuthenticated && !noSidebarRoutes.includes(location.pathname);

  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      {showSidebar && <AppSidebar />}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Any authenticated user */}
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/verify" element={<ProtectedRoute><VerifyTicket /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/buses" element={<ProtectedRoute><Buses /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path="/emergency" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
          <Route path="/school-bus" element={<ProtectedRoute><SchoolBus /></ProtectedRoute>} />
          <Route path="/tracking/:id" element={<ProtectedRoute><BusTracking /></ProtectedRoute>} />
          <Route path="/official-tracking" element={<ProtectedRoute><OrganizationTracking /></ProtectedRoute>} />

          {/* Profile routes – any authenticated user */}
          <Route path="/account" element={<ProtectedRoute><ProfileInfo /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/bookings" element={<ProtectedRoute><ProfileBookings /></ProtectedRoute>} />
          <Route path="/profile/past-rides" element={<ProtectedRoute><ProfilePastRides /></ProtectedRoute>} />
          <Route path="/profile/info" element={<ProtectedRoute><ProfileInfo /></ProtectedRoute>} />
          <Route path="/profile/passengers" element={<ProtectedRoute><ProfilePassengers /></ProtectedRoute>} />
          <Route path="/profile/wallet" element={<ProtectedRoute><ProfileWallet /></ProtectedRoute>} />
          <Route path="/profile/gst" element={<ProtectedRoute><ProfilePlaceholder title={t('profile.gst')} /></ProtectedRoute>} />
          <Route path="/profile/irctc" element={<ProtectedRoute><ProfilePlaceholder title={t('profile.irctc')} /></ProtectedRoute>} />
          <Route path="/profile/offers" element={<ProtectedRoute><ProfilePlaceholder title={t('profile.offers')} /></ProtectedRoute>} />
          <Route path="/profile/referrals" element={<ProtectedRoute><ProfilePlaceholder title={t('profile.referrals')} /></ProtectedRoute>} />
          <Route path="/profile/about" element={<ProtectedRoute><ProfilePlaceholder title={t('profile.about')} /></ProtectedRoute>} />
          <Route path="/profile/rate" element={<ProtectedRoute><ProfilePlaceholder title={t('profile.rate')} /></ProtectedRoute>} />

          {/* Passenger-specific */}
          <Route path="/passenger" element={<RoleRoute roles={["Passenger", "Employee", "Owner", "Admin"]}><PassengerDashboard /></RoleRoute>} />

          {/* Employee / Driver panel – Employee role only */}
          <Route path="/employee" element={<RoleRoute roles={["Employee"]}><EmployeePanel /></RoleRoute>} />
          <Route path="/driver" element={<RoleRoute roles={["Employee"]}><DriverPanel /></RoleRoute>} />

          {/* Owner panel – Owner role only */}
          <Route path="/owner" element={<RoleRoute roles={["Owner"]}><OwnerPanel /></RoleRoute>} />
          <Route path="/owner/route-selection" element={<RoleRoute roles={["Owner"]}><RouteSelection /></RoleRoute>} />

          {/* Admin panel – Admin role only */}
          <Route path="/admin" element={<RoleRoute roles={["Admin"]}><AdminPanel /></RoleRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SidebarProvider defaultOpen={true}>
            <BrowserRouter>
              <ErrorBoundary>
                <AppShell />
              </ErrorBoundary>
            </BrowserRouter>
          </SidebarProvider>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
