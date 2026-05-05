import { BrowserRouter, Routes, Route } from "react-router-dom"
import ProtectedRoute from "./components/ProtectedRoute"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Home from "./pages/Home"
import Perfil from "./pages/Perfil"
import Hogares from "./pages/Hogares"
import Tareas from "./pages/Tareas"
import Gastos from "./pages/Gastos"
import Comprobantes from "./pages/Comprobantes"
import Notificaciones from "./pages/Notificaciones"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil/:id" element={<Perfil />} />
          <Route path="/hogares" element={<Hogares />} />
          <Route path="/tareas" element={<Tareas />} />
          <Route path="/gastos" element={<Gastos />} />
          <Route path="/comprobantes" element={<Comprobantes />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}