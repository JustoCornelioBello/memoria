import React from "react";
import { FaGift, FaStar, FaTimes, FaCheck } from "react-icons/fa";
import { useGame } from "../state/GameContext.jsx";
import { confettiBurst } from "../utils/confetti.js";

export default function ChestModal({ show, onOpen }) {
  const { state, acceptReward, denyReward } = useGame();
  if (!show) return null;

  const reward = state.pendingReward;

  const handleAccept = () => {
    // Confeti primero para que se vea encima aunque cierre el modal
    confettiBurst({ particles: 140, spread: 70, duration: 1800 });
    acceptReward();
  };

  return (
    <div className="modal-backdrop show custom-backdrop">
      <div className="modal bg-dark d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content modal-opaque modal-crisp">
            <div className="modal-header " style={{background:'black', color:'white'}}>
              <h5 className="modal-title d-flex align-items-center gap-2">
                <FaGift /> Cofre de recompensa
              </h5>
            </div>

            <div className="modal-body bg-primary text-white text-center">
              {!reward ? (
                <>
                  <p className="mb-2">Toca para abrir y ver tu premio aleatorio.</p>
                  <button className="btn btn-primary bg-danger animate-pop-precise" onClick={onOpen}>
                    <FaStar className="me-2 " /> Abrir cofre
                  </button>
                  <div className="display-4 mt-3">🎁</div>
                </>
              ) : (
                <div className="reward-wrapper">
                  <div className="reward-card animate-reward-pop">
                    <div className="reward-icon">✨</div>
                    <div className="reward-title">{reward.label}</div>
                  </div>
                  <div className="d-flex justify-content-center gap-2 mt-3">
                    <button className="btn btn-success" onClick={handleAccept}>
                      <FaCheck className="me-1" /> Aceptar
                    </button>
                    <button className="btn btn-outline-danger" onClick={denyReward}>
                      <FaTimes className="me-1" /> Rechazar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer bg-dark justify-content-center">
              {!reward && (
                <button className="btn btn-link text-white" onClick={denyReward}>
                  No ahora
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
