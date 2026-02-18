import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Booking from "./pages/Booking";
import VerifyTicket from "./pages/VerifyTicket";
import PassengerDashboard from "./pages/PassengerDashboard";
import DriverPanel from "./pages/DriverPanel";
import OwnerPanel from "./pages/OwnerPanel";
import AdminPanel from "./pages/AdminPanel";
import SchoolBus from "./pages/SchoolBus";
import Emergency from "./pages/Emergency";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/verify" element={<VerifyTicket />} />
          <Route path="/passenger" element={<PassengerDashboard />} />
          <Route path="/driver" element={<DriverPanel />} />
          <Route path="/owner" element={<OwnerPanel />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/school-bus" element={<SchoolBus />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
