import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";
import Login from "./pages/Login.jsx";
import Challenges from "./pages/Challenges.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import MusicPlayer from "./components/MusicPlayer.jsx";

export default function App() {
  return (
    <div className="app-bg d-flex flex-column">
      <Topbar />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <main className="flex-grow-1 p-3">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tienda" element={<Shop />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/desafios" element={<Challenges />} />
            <Route path="/configuracion" element={<Settings />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}
