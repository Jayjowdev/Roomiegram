import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ProtectedRoute } from "./components/ProtectedRoute"
import "./styles/pages.css"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Planes from "./pages/Planes"
import Dashboard from "./pages/Dashboard"
import Convivencia from "./pages/Convivencia"
import Home from "./pages/Home"
import Historias from "./pages/Historias"
import Compatibilidad from "./pages/Compatibilidad"
import Perfil from "./pages/Perfil"
import MiPerfil from "./pages/MiPerfil"
import MisPublicaciones from "./pages/MisPublicaciones"
import Preferencias from "./pages/Preferencias"
import DetallePublicacion from "./pages/DetallePublicacion"
import CrearPublicacion from "./pages/CrearPublicacion"
import Tareas from "./pages/Tareas"
import Gastos from "./pages/Gastos"
import Comprobantes from "./pages/Comprobantes"
import Notificaciones from "./pages/Notificaciones"
import Hogares from "./pages/Hogares"
import Soporte from "./pages/Soporte"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/historias" element={<ProtectedRoute><Historias /></ProtectedRoute>} />
        <Route path="/compatibilidad" element={<ProtectedRoute><Compatibilidad /></ProtectedRoute>} />
        <Route path="/convivencia" element={<ProtectedRoute><Convivencia /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>} />
        <Route path="/mi-perfil" element={<ProtectedRoute><MiPerfil /></ProtectedRoute>} />
        <Route path="/mis-publicaciones" element={<ProtectedRoute><MisPublicaciones /></ProtectedRoute>} />
        <Route path="/preferencias" element={<ProtectedRoute><Preferencias /></ProtectedRoute>} />
        <Route path="/perfil/:id" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="/detalle-publicacion/:id" element={<ProtectedRoute><DetallePublicacion /></ProtectedRoute>} />
        <Route path="/crear-publicacion" element={<ProtectedRoute><CrearPublicacion /></ProtectedRoute>} />
        <Route path="/publicaciones/:id" element={<ProtectedRoute><DetallePublicacion /></ProtectedRoute>} />
        <Route path="/tareas" element={<ProtectedRoute><Tareas /></ProtectedRoute>} />
        <Route path="/gastos" element={<ProtectedRoute><Gastos /></ProtectedRoute>} />
        <Route path="/comprobantes" element={<ProtectedRoute><Comprobantes /></ProtectedRoute>} />
        <Route path="/notificaciones" element={<ProtectedRoute><Notificaciones /></ProtectedRoute>} />
        <Route path="/hogares" element={<ProtectedRoute><Hogares /></ProtectedRoute>} />
        <Route path="/planes" element={<ProtectedRoute><Planes /></ProtectedRoute>} />
        <Route path="/soporte" element={<ProtectedRoute><Soporte /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
