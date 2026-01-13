import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";

// Lazy-load route pages to reduce initial bundle size
const Index = React.lazy(() => import("./pages/Index"));
const Habits = React.lazy(() => import("./pages/Habits"));
const Training = React.lazy(() => import("./pages/Training"));
const Body = React.lazy(() => import("./pages/Body"));
const Journal = React.lazy(() => import("./pages/Journal"));
const Goals = React.lazy(() => import("./pages/Goals"));
const Stats = React.lazy(() => import("./pages/Stats"));
const Study = React.lazy(() => import("./pages/Study"));
const Quiz = React.lazy(() => import("./pages/Quiz"));
const Vocabulary = React.lazy(() => import("./pages/Vocabulary"));
const Records = React.lazy(() => import("./pages/Records"));
const Courses = React.lazy(() => import("./pages/Courses"));
const Finance = React.lazy(() => import("./pages/Finance"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Vices = React.lazy(() => import("./pages/Vices"));
const Instrutor = React.lazy(() => import("./pages/Instrutor"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Login = React.lazy(() => import("./pages/Login"));
const DebugAuth = React.lazy(() => import("./pages/DebugAuth"));
import AuthGate from "./components/AuthGate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <AuthGate>
          <Suspense fallback={<div/>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/debug-auth" element={<DebugAuth />} />
              <Route path="/instrutor" element={<Instrutor />} />
              <Route path="/" element={<Index />} />
              <Route path="/habits" element={<Habits />} />
              <Route path="/training" element={<Training />} />
              <Route path="/body" element={<Body />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/study" element={<Study />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/vocabulary" element={<Vocabulary />} />
              <Route path="/records" element={<Records />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/vices" element={<Vices />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthGate>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
