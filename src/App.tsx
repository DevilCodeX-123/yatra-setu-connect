import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import Index from "./pages/Index";
import Booking from "./pages/Booking";
import VerifyTicket from "./pages/VerifyTicket";
import PassengerDashboard from "./pages/PassengerDashboard";
import DriverPanel from "./pages/DriverPanel";
import OwnerPanel from "./pages/OwnerPanel";
import AdminPanel from "./pages/AdminPanel";
import SchoolBus from "./pages/SchoolBus";
import Emergency from "./pages/Emergency";
import Transactions from "./pages/Transactions";
import Account from "./pages/Account";
import Lentings from "./pages/Lentings";
import Profile from "./pages/Profile";
import ProfileBookings from "./pages/ProfileBookings";
import ProfileInfo from "./pages/ProfileInfo";
import ProfilePassengers from "./pages/ProfilePassengers";
import ProfileWallet from "./pages/ProfileWallet";
import ProfilePlaceholder from "./pages/ProfilePlaceholder";
import Support from "./pages/Support";
import BusTracking from "./pages/BusTracking";
import Login from "./pages/Login";
import RouteSelection from "./pages/RouteSelection";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppShell = () => {
  const location = useLocation();
  const noSidebarRoutes = ["/login", "/404"];
  const showSidebar = !noSidebarRoutes.includes(location.pathname);

  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      {showSidebar && <AppSidebar />}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/verify" element={<VerifyTicket />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/account" element={<Account />} />
          <Route path="/lentings" element={<Lentings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/bookings" element={<ProfileBookings />} />
          <Route path="/profile/info" element={<ProfileInfo />} />
          <Route path="/profile/passengers" element={<ProfilePassengers />} />
          <Route path="/profile/wallet" element={<ProfileWallet />} />
          <Route path="/profile/gst" element={<ProfilePlaceholder title="GST Details" />} />
          <Route path="/profile/irctc" element={<ProfilePlaceholder title="IRCTC Details" />} />
          <Route path="/profile/offers" element={<ProfilePlaceholder title="Active Offers" />} />
          <Route path="/profile/referrals" element={<ProfilePlaceholder title="Referral Program" />} />
          <Route path="/profile/about" element={<ProfilePlaceholder title="About Yatra Setu" />} />
          <Route path="/profile/rate" element={<ProfilePlaceholder title="Rate Experience" />} />
          <Route path="/support" element={<Support />} />
          <Route path="/tracking/:id" element={<BusTracking />} />
          <Route path="/passenger" element={<PassengerDashboard />} />
          <Route path="/driver" element={<DriverPanel />} />
          <Route path="/owner" element={<OwnerPanel />} />
          <Route path="/owner/route-selection" element={<RouteSelection />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/school-bus" element={<SchoolBus />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SidebarProvider defaultOpen={true}>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </SidebarProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
