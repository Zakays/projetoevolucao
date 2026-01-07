import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Habits from "./pages/Habits";
import Training from "./pages/Training";
import Body from "./pages/Body";
import Journal from "./pages/Journal";
import Goals from "./pages/Goals";
import Stats from "./pages/Stats";
import Study from "./pages/Study";
import Quiz from "./pages/Quiz";
import Vocabulary from "./pages/Vocabulary";
import Records from "./pages/Records";
import Courses from "./pages/Courses";
import Finance from "./pages/Finance";
import Settings from "./pages/Settings";
import Instrutor from "./pages/Instrutor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
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
          <Route path="/settings" element={<Settings />} />
          <Route path="/instrutor" element={<Instrutor />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
