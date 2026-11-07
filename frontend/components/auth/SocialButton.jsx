import React from 'react';

export function SocialButton({ icon, label, onClick }) {
  return (
    <button type="button" className="auth-social-btn" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default SocialButton;
