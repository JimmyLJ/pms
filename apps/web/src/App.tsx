import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { ThemeProvider } from "./lib/theme"
import RootRedirect from "./components/root-redirect"
import OnboardingPage from "./pages/onboarding"
import SignInPage from "./pages/sign-in"
import SignUpPage from "./pages/sign-up"
import WorkspaceLayout from "./components/workspace-layout"
import DashboardPage from "./pages/dashboard"
import ProjectsPage from "./pages/projects"
import ProjectBoardPage from "./pages/project-board"
import MembersPage from "./pages/members"

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />

          {/* Workspace Routes */}
          <Route path="/w/:workspaceId" element={<WorkspaceLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:projectId" element={<ProjectBoardPage />} />
            <Route path="members" element={<MembersPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}