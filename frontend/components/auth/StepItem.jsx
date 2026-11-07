import React from 'react';

export function StepItem({ number, text, active = false, onClick }) {
  return (
    <button
      type="button"
      className={`auth-step-item ${active ? 'is-active' : ''}`}
      onClick={onClick}
      aria-current={active ? 'step' : undefined}
    >
      <span className="auth-step-badge">{number}</span>
      <span>{text}</span>
    </button>
  );
}

export default StepItem;
