import React from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";
import Login from "./pages/Login.jsx";

export default function App() {
  return (
    <div className="d-flex min-vh-100 app-bg">
      <Sidebar />
      <main className="flex-grow-1 p-3 p-md-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tienda" element={<Shop />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/configuracion" element={<Settings />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}
