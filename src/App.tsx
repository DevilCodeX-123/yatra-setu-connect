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
import Account from "./pages/Account";
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

const queryClient = new QueryClient();

// Guard: sirf logged-in users ke liye
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppShell = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const noSidebarRoutes = ["/login", "/404", "/employee"];
  const showSidebar = isAuthenticated && !noSidebarRoutes.includes(location.pathname);

  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      {showSidebar && <AppSidebar />}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/verify" element={<ProtectedRoute><VerifyTicket /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/buses" element={<ProtectedRoute><Buses /></ProtectedRoute>} />
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
          <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path="/tracking/:id" element={<ProtectedRoute><BusTracking /></ProtectedRoute>} />
          <Route path="/passenger" element={<ProtectedRoute><PassengerDashboard /></ProtectedRoute>} />
          <Route path="/driver" element={<ProtectedRoute><DriverPanel /></ProtectedRoute>} />
          <Route path="/owner" element={<ProtectedRoute><OwnerPanel /></ProtectedRoute>} />
          <Route path="/owner/route-selection" element={<ProtectedRoute><RouteSelection /></ProtectedRoute>} />
          <Route path="/employee" element={<ProtectedRoute><EmployeePanel /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/school-bus" element={<ProtectedRoute><SchoolBus /></ProtectedRoute>} />
          <Route path="/emergency" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
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
              <AppShell />
            </BrowserRouter>
          </SidebarProvider>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
