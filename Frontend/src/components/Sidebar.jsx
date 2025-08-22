import React from "react";
import { NavLink } from "react-router-dom";
import { FaHome, FaStore, FaUser, FaCog, FaSignInAlt } from "react-icons/fa";
import { useGame } from "../state/GameContext.jsx";

export default function Sidebar() {
  const { state } = useGame();
  const linkClass = ({ isActive }) => "link" + (isActive ? " active" : "");

  return (
    <aside className="sidebar d-none d-md-flex flex-column p-3">
      <div className="brand">
        <div className="logo" />
        <h4>Memoria</h4>
      </div>

      <nav className="nav flex-column gap-2">
        <NavLink className={linkClass} to="/">
          <FaHome /> <span>Inicio</span>
        </NavLink>
        <NavLink className={linkClass} to="/tienda">
          <FaStore /> <span>Tienda</span>
        </NavLink>
        <NavLink className={linkClass} to="/perfil">
          <FaUser /> <span>Perfil</span>
        </NavLink>
        <NavLink className={linkClass} to="/configuracion">
          <FaCog /> <span>Configuración</span>
        </NavLink>
        {!state.isLoggedIn && (
          <NavLink className={linkClass} to="/login">
            <FaSignInAlt /> <span>Iniciar sesión</span>
          </NavLink>
        )}
      </nav>

      <div className="footer small">v1.0 · hecho con ❤️</div>
    </aside>
  );
}
