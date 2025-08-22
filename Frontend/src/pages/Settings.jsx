import React, { useMemo, useState } from "react";
import { useGame } from "../state/GameContext.jsx";
import { FaDownload, FaTrash, FaBug, FaSignOutAlt, FaSave, FaBell, FaVial } from "react-icons/fa";

export default function Settings() {
  const {
    state, setDisplayName, toggleSound, toggleVibration,
    logout, resetProgress, getSnapshot
  } = useGame();

  const [name, setName] = useState(state.displayName || "");
  const [report, setReport] = useState({ asunto: "", detalle: "" });

  const canSave = name.trim().length > 0 && name.trim() !== (state.displayName || "");

  const handleSaveName = (e) => {
    e.preventDefault();
    setDisplayName(name.trim());
  };

  const handleDownload = () => {
    const data = getSnapshot();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "memoria_datos.json";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (confirm("¿Seguro que quieres reiniciar tu progreso? Esta acción no se puede deshacer.")) {
      resetProgress();
      alert("Progreso reiniciado.");
    }
  };

  const handleReport = () => {
    const payload = {
      asunto: report.asunto.trim() || "(sin asunto)",
      detalle: report.detalle.trim() || "(sin detalle)",
      nivel: state.level,
      exp: state.exp,
      coins: state.coins,
      user: state.displayName || "Jugador",
      when: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "reporte_memoria.json";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    alert("Se generó un archivo con tu reporte. ¡Gracias!");
  };

  const handleLogout = () => {
    if (confirm("¿Cerrar sesión? Podrás iniciar de nuevo más tarde.")) {
      logout();
    }
  };

  return (
    <div className="container">
      <div className="card p-3 shadow-sm animate-fade-in mb-3">
        <h4 className="m-0">Configuración</h4>
      </div>

      {/* Perfil */}
      <div className="card p-3 shadow-sm mb-3">
        <h5>Perfil</h5>
        <form className="row g-2 align-items-end" onSubmit={handleSaveName}>
          <div className="col-12 col-md-6">
            <label className="form-label">Nombre de usuario</label>
            <input
              className="form-control"
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <div className="col-12 col-md-auto">
            <button className="btn btn-primary" type="submit" disabled={!canSave}>
              <FaSave className="me-2" /> Guardar
            </button>
          </div>
        </form>
      </div>

      {/* Preferencias */}
      <div className="card p-3 shadow-sm mb-3">
        <h5>Preferencias</h5>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-outline-light" onClick={toggleSound}>
            <FaBell className="me-2" />
            Sonido: <strong className="ms-1">{state.soundOn ? "ON" : "OFF"}</strong>
          </button>
          <button className="btn btn-outline-light" onClick={toggleVibration}>
            <FaVial className="me-2" />
            Vibración: <strong className="ms-1">{state.vibrationOn ? "ON" : "OFF"}</strong>
          </button>
        </div>
      </div>

      {/* Datos */}
      <div className="card p-3 shadow-sm mb-3">
        <h5>Datos</h5>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-success" onClick={handleDownload}>
            <FaDownload className="me-2" /> Descargar mis datos
          </button>
          <button className="btn btn-outline-danger" onClick={handleReset}>
            <FaTrash className="me-2" /> Reiniciar progreso
          </button>
        </div>
      </div>

      {/* Reporte */}
      <div className="card p-3 shadow-sm mb-3">
        <h5>Reportar un problema</h5>
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <input
              className="form-control"
              placeholder="Asunto"
              value={report.asunto}
              onChange={(e) => setReport((r) => ({ ...r, asunto: e.target.value }))}
            />
          </div>
          <div className="col-12">
            <textarea
              className="form-control"
              rows={4}
              placeholder="Describe el problema..."
              value={report.detalle}
              onChange={(e) => setReport((r) => ({ ...r, detalle: e.target.value }))}
            />
          </div>
          <div className="col-12">
            <button className="btn btn-warning text-dark" onClick={handleReport}>
              <FaBug className="me-2" /> Generar reporte
            </button>
          </div>
        </div>
      </div>

      {/* Sesión */}
      <div className="card p-3 shadow-sm mb-5">
        <h5>Sesión</h5>
        <div className="d-flex">
          <button className="btn btn-outline-light" onClick={handleLogout}>
            <FaSignOutAlt className="me-2" /> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
