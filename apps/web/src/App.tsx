import { BrowserRouter, Routes, Route } from "react-router-dom"
import HomePage from "./pages/home"
import SignInPage from "./pages/sign-in"
import SignUpPage from "./pages/sign-up"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
      </Routes>
    </BrowserRouter>
  )
}