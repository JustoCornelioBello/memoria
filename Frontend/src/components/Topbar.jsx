import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FaBars, FaTimes, FaHome, FaStore, FaUser, FaCog, FaTrophy, FaSignInAlt } from "react-icons/fa";
import { useGame } from "../state/GameContext.jsx";

export default function Topbar() {
  const { state } = useGame();
  const [open, setOpen] = useState(false);
  const linkClass = ({ isActive }) => "menu-link" + (isActive ? " active" : "");

  return (
    <header className="topbar d-md-none">
      <div className="container d-flex align-items-center justify-content-between">
        <Link to="/" className="brand-mini">Memoria</Link>
        <button className="btn btn-outline-light btn-sm" onClick={() => setOpen(o => !o)} aria-label="Abrir menú">
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {open && (
        <nav className="topmenu">
          <NavLink onClick={()=>setOpen(false)} className={linkClass} to="/"><FaHome /> Inicio</NavLink>
          <NavLink onClick={()=>setOpen(false)} className={linkClass} to="/tienda"><FaStore /> Tienda</NavLink>
          <NavLink onClick={()=>setOpen(false)} className={linkClass} to="/perfil"><FaUser /> Perfil</NavLink>
          <NavLink onClick={()=>setOpen(false)} className={linkClass} to="/desafios"><FaTrophy /> Desafíos</NavLink>
          <NavLink onClick={()=>setOpen(false)} className={linkClass} to="/configuracion"><FaCog /> Configuración</NavLink>
          {!state.isLoggedIn && (
            <NavLink onClick={()=>setOpen(false)} className={linkClass} to="/login"><FaSignInAlt /> Iniciar sesión</NavLink>
          )}
        </nav>
      )}
    </header>
  );
}
