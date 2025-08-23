// src/pages/Settings.jsx
import React, { useMemo, useRef, useState } from "react";
import { useGame } from "../state/GameContext.jsx";
import {
  FaSave, FaBell, FaVial, FaDownload, FaUpload, FaTrash,
  FaBug, FaSignOutAlt, FaSignInAlt, FaUser, FaShieldAlt, FaCheckCircle,
  FaMusic, FaVolumeUp, FaFileContract, FaUserShield,
  FaEnvelope, FaCopy, FaWhatsapp, FaExternalLinkAlt, FaInfoCircle, FaBook
} from "react-icons/fa";
import { Sound } from "../utils/sound.js";

const STORAGE_KEY  = "memoria_progress_v6";
const SETTINGS_KEY = "memoria_settings_v4";

// 📮 Config de contacto
const SUPPORT_EMAIL = "justocorneliobellolouis@gmail.com";   // <-- cambia a tu correo
const WHATSAPP_NUM  = "18095550123";           // <-- cambia a tu número (formato internacional sin +)

function Toast({ show, type="success", text, onClose }) {
  if (!show) return null;
  return (
    <div className={`toast-fx ${type}`} role="alert" onClick={onClose}>
      {type === "success" ? <FaCheckCircle className="me-2" /> : null}
      {text}
    </div>
  );
}

export default function Settings() {
  const {
    state, setDisplayName, toggleSound, toggleVibration,
    resetProgress, getSnapshot, logout, login,
    setMusicOn, setMusicVol
  } = useGame();

  const [name, setName] = useState(state.displayName || "");
  const [toast, setToast] = useState({ show: false, type: "success", text: "" });
  const [confirming, setConfirming] = useState(null); // "reset" | "wipe" | null
  const [openAcc, setOpenAcc] = useState(null); // "terms" | "privacy" | null
  const fileRef = useRef(null);

  const initials = useMemo(() => {
    const n = (name || "Jugador").trim();
    const parts = n.split(/\s+/).slice(0,2);
    return parts.map(p => p[0]?.toUpperCase() || "").join("") || "J";
  }, [name]);

  const canSave = name.trim().length > 0 && name.trim() !== (state.displayName || "");

  const showToast = (text, type="success") => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type, text: "" }), 1800);
  };

  // PERFIL
  const handleSaveName = (e) => {
    e?.preventDefault?.();
    const n = name.trim();
    if (!n) return;
    setDisplayName(n);
    showToast("Nombre actualizado");
  };

  // PREFERENCIAS
  const testSound = () => { Sound.flip(true); showToast("Sonido de prueba"); };
  const testVibration = () => { if (navigator.vibrate) navigator.vibrate([20,40,20]); showToast("Vibración de prueba"); };

  // DATOS
  const handleDownload = () => {
    const data = getSnapshot();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "memoria_datos.json";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    showToast("Datos exportados");
  };

  const handleImportClick = () => fileRef.current?.click();
  const handleFile = async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json || typeof json !== "object") throw new Error("Archivo inválido");
      const { progress, settings } = json;

      // No sobreescribas el nombre actual al importar (lo mantenemos)
      if (settings && typeof settings === "object") {
        const sCopy = { ...settings, displayName: state.displayName };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(sCopy));
      }
      if (progress && typeof progress === "object") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      }
      showToast("Datos importados. Recargando…");
      setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      console.error(e);
      showToast("Error al importar", "error");
    } finally {
      ev.target.value = "";
    }
  };

  // CONFIRMACIONES
  const askConfirm = (what) => setConfirming(what);
  const closeConfirm = () => setConfirming(null);

  const doReset = () => { resetProgress(); setConfirming(null); showToast("Progreso reiniciado"); };
  const doWipeAll = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SETTINGS_KEY);
      setConfirming(null);
      showToast("Datos borrados. Recargando…");
      setTimeout(() => window.location.reload(), 900);
    } catch {
      showToast("No se pudieron borrar los datos", "error");
    }
  };

  // CONTACTO (sin inputs)
  const mailtoHref = () => {
    const subject = encodeURIComponent("Soporte Memoria – Ayuda");
    const body = encodeURIComponent(
      `Hola,\n\nNecesito ayuda con el juego.\n\nUsuario: ${state.displayName || "Jugador"}\nNivel: ${state.level}\nXP: ${state.exp}\nMonedas: ${state.coins}\n\nDescripción:\n(Escribe aquí)\n`
    );
    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };
  const whatsappHref = () => {
    const text = encodeURIComponent(
      `Hola, necesito ayuda con el juego.\nUsuario: ${state.displayName || "Jugador"}\nNivel: ${state.level}\nXP: ${state.exp}\nMonedas: ${state.coins}`
    );
    return `https://wa.me/${WHATSAPP_NUM}?text=${text}`;
  };
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      showToast("Correo copiado");
    } catch {
      showToast("No se pudo copiar", "error");
    }
  };
  const handleReport = () => {
    const payload = {
      asunto: "Reporte rápido (auto)",
      detalle: "Adjunto estado del juego.",
      meta: {
        nivel: state.level, exp: state.exp, coins: state.coins,
        user: state.displayName || "Jugador",
        when: new Date().toISOString(),
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "reporte_memoria.json";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    showToast("Reporte generado");
  };

  // UI
  const Acc = ({ id, icon, title, subtitle, children }) => {
    const open = openAcc === id;
    return (
      <div className="acc-item">
        <button className="acc-head" onClick={() => setOpenAcc(open ? null : id)}>
          <div className="d-flex align-items-center gap-2">
            {icon}{title}
          </div>
          <span className="acc-caret">{open ? "−" : "+"}</span>
        </button>
        <div className={`acc-body ${open ? "open" : ""}`}>
          {subtitle ? <div className="acc-subtitle">{subtitle}</div> : null}
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="container settings-page" style={{height:'760px', overflowY:'auto'}}>
      {/* HERO */}
      <div className="settings-hero card glass p-3 p-md-4 mb-3">
        <div className="d-flex align-items-center gap-3">
          <div className="profile-avatar xl"><span>{initials}</span></div>
          <div className="flex-grow-1">
            <h4 className="m-0">{state.displayName || "Jugador"}</h4>
            <div className="opacity-80">Nivel {state.level} • XP {state.exp} • Monedas {state.coins}</div>
          </div>
          <div className="badge bg-primary-subtle text-primary d-none d-md-inline">
            {state.isLoggedIn ? "Sesión activa" : "Sin sesión"}
          </div>
        </div>
      </div>

      {/* PERFIL */}
      <div className="card glass p-3 p-md-4 mb-3">
        <div className="section-title"><FaUser className="me-2" /> Perfil</div>
        <form className="row g-2 align-items-end" onSubmit={handleSaveName}>
          <div className="col-12 col-md-6">
            <label className="form-label">Nombre de usuario</label>
            <input
              className="form-control form-control-lg"
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <div className="col-12 col-md-auto">
            <button className="btn btn-primary btn-lg" type="submit" disabled={!canSave}>
              <FaSave className="me-2" /> Guardar
            </button>
          </div>
          {!state.isLoggedIn && (
            <div className="col-12 mt-2">
              <button className="btn btn-outline-light" onClick={(e)=>{e.preventDefault(); if(name.trim()) {login(name.trim()); showToast("Sesión iniciada");}}}>
                <FaSignInAlt className="me-2" /> Iniciar sesión con este nombre
              </button>
            </div>
          )}
        </form>
      </div>

      {/* PREFERENCIAS (incluye música) */}
      <div className="card glass p-3 p-md-4 mb-3">
        <div className="section-title"><FaShieldAlt className="me-2" /> Preferencias</div>

        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-6 d-flex gap-2">
            <button className="btn btn-toggle" onClick={toggleSound}>
              <FaBell className="me-2" />
              Sonido: <strong className="ms-1">{state.soundOn ? "ON" : "OFF"}</strong>
            </button>
            <button className="btn btn-secondary" onClick={testSound}>Probar</button>
          </div>
          <div className="col-12 col-md-6 d-flex gap-2">
            <button className="btn btn-toggle" onClick={toggleVibration}>
              <FaVial className="me-2" />
              Vibración: <strong className="ms-1">{state.vibrationOn ? "ON" : "OFF"}</strong>
            </button>
            <button className="btn btn-secondary" onClick={testVibration}>Probar</button>
          </div>
        </div>

        {/* 🎵 Música */}
        <div className="row g-3 align-items-center mt-1">
          <div className="col-12 col-md-6 d-flex align-items-center gap-2">
            <button className="btn btn-toggle" onClick={() => setMusicOn(!state.musicOn)}>
              <FaMusic className="me-2" />
              Música: <strong className="ms-1">{state.musicOn ? "ON" : "OFF"}</strong>
            </button>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label d-flex align-items-center gap-2">
              <FaVolumeUp /> Volumen
            </label>
            <input
              type="range"
              className="form-range"
              min="0" max="1" step="0.01"
              value={state.musicVol}
              onChange={(e) => setMusicVol(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* DATOS */}
      <div className="card glass p-3 p-md-4 mb-3">
        <div className="section-title">Datos</div>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-success" onClick={handleDownload}>
            <FaDownload className="me-2" /> Exportar datos
          </button>
          <input ref={fileRef} onChange={handleFile} type="file" accept="application/json" hidden />
          <button className="btn btn-info text-dark" onClick={handleImportClick}>
            <FaUpload className="me-2" /> Importar datos
          </button>
        </div>
        <div className="small opacity-80 mt-2">
          La importación respeta tu nombre actual. Si quieres restaurar también el nombre del backup, podrás cambiarlo manualmente.
        </div>
      </div>

      {/* 🔐 Legales: Términos & Privacidad */}
      <div className="card glass p-3 p-md-4 mb-3">
        <div className="section-title"><FaBook className="me-2" /> Legal</div>

        <Acc
          id="terms"
          icon={<FaFileContract />}
          title={<span> <strong className="ms-2">Términos de uso</strong></span>}
          subtitle={<span className="small opacity-75">Última actualización: 2025-08-01</span>}
        >
          <ul className="list-unstyled mb-2">
            <li className="mb-1"><FaInfoCircle className="me-2 opacity-75"/> El juego es para entretenimiento. No se garantiza disponibilidad continua.</li>
            <li className="mb-1"><FaInfoCircle className="me-2 opacity-75"/> No compartas tu progreso ni intentos de manipulación de datos.</li>
            <li className="mb-1"><FaInfoCircle className="me-2 opacity-75"/> Podemos actualizar las reglas, economía y recompensas sin previo aviso.</li>
          </ul>
          <a href="#" className="btn btn-sm btn-outline-secondary disabled" aria-disabled>
            <FaExternalLinkAlt className="me-2" /> Ver versión extendida (próximamente)
          </a>
        </Acc>

        <Acc
          id="privacy"
          icon={<FaUserShield />}
          title={<span> <strong className="ms-2">Política de privacidad</strong></span>}
          subtitle={<span className="small opacity-75">Última actualización: 2025-08-01</span>}
        >
          <ul className="list-unstyled mb-2">
            <li className="mb-1"><FaInfoCircle className="me-2 opacity-75"/> Guardamos tus datos de juego en tu navegador (localStorage).</li>
            <li className="mb-1"><FaInfoCircle className="me-2 opacity-75"/> No enviamos tus datos a servidores externos.</li>
            <li className="mb-1"><FaInfoCircle className="me-2 opacity-75"/> Puedes exportar/importar o borrar todo desde este panel.</li>
          </ul>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary btn-sm" onClick={handleDownload}>
              <FaDownload className="me-2" /> Descargar mis datos
            </button>
            <button className="btn btn-outline-danger btn-sm" onClick={() => askConfirm("wipe")}>
              <FaTrash className="me-2" /> Borrar todo
            </button>
          </div>
        </Acc>
      </div>

      {/* 📮 Contacto (sin inputs) */}
      <div className="card glass p-3 p-md-4 mb-3">
        <div className="section-title"><FaEnvelope className="me-2" /> Contacto</div>
        <div className="row g-2">
          <div className="col-12 col-md-6 d-flex gap-2">
            <a className="btn btn-primary flex-grow-1" href={mailtoHref()}>
              <FaEnvelope className="me-2" /> Enviar Email
            </a>
            <button className="btn btn-outline-secondary" onClick={copyEmail}>
              <FaCopy className="me-2" /> Copiar correo
            </button>
          </div>
          <div className="col-12 col-md-6 d-flex gap-2">
            <a className="btn btn-success flex-grow-1" href={whatsappHref()} target="_blank" rel="noreferrer">
              <FaWhatsapp className="me-2" /> WhatsApp
            </a>
            <button className="btn btn-warning text-dark" onClick={handleReport}>
              <FaBug className="me-2" /> Generar reporte
            </button>
          </div>
          <div className="col-12">
            <div className="small opacity-80">
              Al hacer clic en Email/WhatsApp se adjunta info básica (usuario, nivel, XP, monedas) para ayudarte más rápido.
            </div>
          </div>
        </div>
      </div>

      {/* SESIÓN & ZONA PELIGRO */}
      <div className="card glass p-3 p-md-4 mb-5">
        <div className="section-title">Sesión</div>
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button className="btn btn-outline-light" onClick={() => logout()}>
            <FaSignOutAlt className="me-2" /> Cerrar sesión
          </button>
          <button className="btn btn-outline-danger" onClick={() => askConfirm("reset")}>
            <FaTrash className="me-2" /> Reiniciar progreso
          </button>
          <button className="btn btn-danger" onClick={() => askConfirm("wipe")}>
            <FaTrash className="me-2" /> Borrar TODO (localStorage)
          </button>
        </div>
        <div className="small opacity-80">
          Reiniciar progreso conserva tu nombre y preferencias. Borrar TODO elimina también los datos guardados.
        </div>
      </div>

      {/* CONFIRMACIONES */}
      {confirming && <div className="modal-backdrop custom-backdrop show" />}
      <div className={`modal ${confirming ? "show d-block" : ""}`} tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content modal-opaque modal-crisp">
            <div className="modal-header">
              <h5 className="modal-title">
                {confirming === "reset" ? "Reiniciar progreso" : "Borrar TODO"}
              </h5>
              <button type="button" className="btn-close" onClick={closeConfirm} />
            </div>
            <div className="modal-body">
              {confirming === "reset"
                ? "¿Seguro que quieres reiniciar tu progreso? Esta acción no se puede deshacer."
                : "Vas a borrar TODO de esta app en este navegador (localStorage). Se recargará la página."
              }
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" onClick={closeConfirm}>Cancelar</button>
              {confirming === "reset" ? (
                <button className="btn btn-danger" onClick={doReset}>Reiniciar</button>
              ) : (
                <button className="btn btn-danger" onClick={doWipeAll}>Borrar TODO</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TOAST */}
      <Toast show={toast.show} type={toast.type} text={toast.text} onClose={() => setToast({ show:false, type:"success", text:"" })} />
    </div>
  );
}
