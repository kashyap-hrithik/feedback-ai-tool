// src/components/FloatingFeedbackButton.tsx
import React from "react";
import { MessageSquare } from "lucide-react";

interface FloatingFeedbackButtonProps {
  onClick: () => void;
}

const FloatingFeedbackButton: React.FC<FloatingFeedbackButtonProps> = ({
  onClick,
}) => {
  const style: React.CSSProperties = {
    position: "fixed",
    bottom: "30px",
    right: "30px",
    backgroundColor: "#007bff", // A standard blue
    color: "white",
    padding: "12px 20px",
    borderRadius: "50px",
    border: "none",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.25)",
    cursor: "pointer",
    fontSize: "16px",
    zIndex: 1000, // Above page content, below modal
    display: "flex",
    alignItems: "center",
  };

  const iconStyle: React.CSSProperties = {
    marginRight: "8px",
  };

  return (
    <button
      id="floating-feedback-button"
      onClick={onClick}
      style={style}
      aria-label="Open feedback panel"
    >
      <MessageSquare size={20} style={iconStyle} />
      Feedback
    </button>
  );
};

export default FloatingFeedbackButton;
