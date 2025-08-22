import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../state/GameContext.jsx";
import { FaSignInAlt } from "react-icons/fa";

export default function Login() {
  const { state, login } = useGame();
  const [name, setName] = useState(state.displayName || "");
  const nav = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    login(n);
    nav("/"); // a inicio
  };

  return (
    <div className="container">
      <div className="card p-4 shadow-sm mx-auto" style={{maxWidth: 520}}>
        <h4 className="mb-3">Iniciar sesión</h4>
        <form onSubmit={handleSubmit} className="d-flex gap-2">
          <input
            className="form-control"
            placeholder="Tu nombre"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            <FaSignInAlt className="me-2" />
            Entrar
          </button>
        </form>
        <div className="opacity-75 mt-2">Solo necesitas tu nombre para jugar.</div>
      </div>
    </div>
  );
}
