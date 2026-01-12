import { BrowserRouter, Routes, Route } from "react-router-dom"
import HomePage from "./pages/home"
import SignInPage from "./pages/sign-in"
import SignUpPage from "./pages/sign-up"
import WorkspaceLayout from "./components/workspace-layout"
import DashboardPage from "./pages/dashboard"
import ProjectsPage from "./pages/projects"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        
        {/* Workspace Routes */}
        <Route path="/w/:workspaceId" element={<WorkspaceLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<div>Kanban Board Placeholder</div>} />
          <Route path="settings" element={<div>Settings Placeholder</div>} />
          <Route path="members" element={<div>Members Placeholder</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}