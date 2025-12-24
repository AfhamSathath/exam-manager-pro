// frontend/src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreatePaper from "./pages/CreatePaper";
import MyPapers from "./pages/MyPapers";
import PaperDetail from "./pages/PaperDetail";
import PendingReview from "./pages/PendingReview";
import ReviewPaper from "./pages/ReviewPaper";
import ModeratedPapers from "./pages/ModeratedPapers";
import PendingApproval from "./pages/PendingApproval";
import ApprovePaper from "./pages/ApprovePaper";
import ApprovedPapers from "./pages/ApprovedPapers";
import Repository from "./pages/Repository";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/**
 * ProtectedRoute waits for auth to restore before rendering
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();

  if (user === undefined) return <div>Loading...</div>; // optional spinner

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/dashboard/create-paper" element={<ProtectedRoute><CreatePaper /></ProtectedRoute>} />
    <Route path="/dashboard/papers" element={<ProtectedRoute><MyPapers /></ProtectedRoute>} />
    <Route path="/dashboard/papers/:id" element={<ProtectedRoute><PaperDetail /></ProtectedRoute>} />
    <Route path="/dashboard/review" element={<ProtectedRoute><PendingReview /></ProtectedRoute>} />
    <Route path="/dashboard/review/:id" element={<ProtectedRoute><ReviewPaper /></ProtectedRoute>} />
    <Route path="/dashboard/moderated" element={<ProtectedRoute><ModeratedPapers /></ProtectedRoute>} />
    <Route path="/dashboard/approval" element={<ProtectedRoute><PendingApproval /></ProtectedRoute>} />
    <Route path="/dashboard/approval/:id" element={<ProtectedRoute><ApprovePaper /></ProtectedRoute>} />
    <Route path="/dashboard/approved" element={<ProtectedRoute><ApprovedPapers /></ProtectedRoute>} />
    <Route path="/dashboard/repository" element={<ProtectedRoute><Repository /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
