// src/App.tsx
import React, { useState, useEffect } from "react";
import FloatingFeedbackButton from "./components/FloatingFeedbackButton";
import FeedbackModal from "./components/FeedbackModal";
import { supabase } from "./supabaseClient";
import {
  AlertTriangle,
  LayoutDashboard,
  Settings,
  HelpCircle,
  FileText,
  Users,
  CreditCard,
  BarChart3,
} from "lucide-react"; // Added BarChart3

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supabaseInitialized, setSupabaseInitialized] = useState(false);

  useEffect(() => {
    if (supabase) {
      setSupabaseInitialized(true);
      console.log("App.tsx: Supabase client initialized.");
    } else {
      console.error(
        "App.tsx: CRITICAL - Supabase client is NULL. Check .env.local and supabaseClient.ts"
      );
    }
  }, []);

  const openModal = () => {
    if (!supabaseInitialized) {
      alert(
        "Feedback system is currently unavailable. Supabase client not initialized."
      );
      return;
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  // Inline styles for elements that need specific, non-reusable styling
  const headerStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    position: "sticky",
    top: 0,
    zIndex: 30,
    padding: "12px 0",
  };

  const headerContentStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const logoStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const navStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const navButtonStyle: React.CSSProperties = {
    padding: "8px",
    borderRadius: "50%",
    color: "#4b5563",
    cursor: "pointer",
  };

  const avatarStyle: React.CSSProperties = {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "2px solid #3b82f6",
  };

  const mainContentHeaderStyle: React.CSSProperties = {
    marginBottom: "32px",
    paddingTop: "32px",
  };

  const mainTitleStyle: React.CSSProperties = {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: "8px",
  };

  const subTitleStyle: React.CSSProperties = {
    fontSize: "1.125rem",
    color: "#4b5563",
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gap: "24px",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  };

  // Card component using the .styled-card class from index.css
  const Card: React.FC<{
    title: string;
    icon: React.ElementType;
    description?: string;
  }> = ({ title, icon: Icon, description }) => (
    <div className="styled-card">
      <div
        style={{
          padding: "12px",
          backgroundColor: "#e0e7ff",
          borderRadius: "50%",
          marginBottom: "16px",
          display: "inline-block",
        }}
      >
        <Icon size={28} style={{ color: "#4f46e5" }} />
      </div>
      <h3
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "#1f2937",
          marginBottom: "8px",
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: "1.5" }}>
        {description ||
          "Some placeholder details for this card will go here to provide context."}
      </p>
    </div>
  );

  // Style for the chart placeholder
  const chartPlaceholderStyle: React.CSSProperties = {
    height: "224px",
    backgroundColor: "#e9eef2", // Softer gray
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column", // To stack icon and text
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#a0aec0", // Lighter text color (Tailwind gray-500)
    border: "2px dashed #cbd5e0", // Dashed border (Tailwind gray-400)
  };

  const chartIconStyle: React.CSSProperties = {
    marginBottom: "12px",
    color: "#718096", // Tailwind gray-600
  };

  return (
    <div>
      <header style={headerStyle}>
        <div className="app-container" style={headerContentStyle}>
          <div style={logoStyle}>
            <LayoutDashboard size={28} style={{ color: "#3b82f6" }} />
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#111827",
              }}
            >
              My Dashboard
            </h1>
          </div>
          <nav style={navStyle}>
            <button style={navButtonStyle} title="Help">
              <HelpCircle size={20} />
            </button>
            <button style={navButtonStyle} title="Settings">
              <Settings size={20} />
            </button>
            <img
              src={`https://i.pravatar.cc/36?u=app-user`}
              alt="User Avatar"
              style={avatarStyle}
            />
          </nav>
        </div>
      </header>

      <main className="app-container">
        <div style={mainContentHeaderStyle}>
          <h2 style={mainTitleStyle}>Welcome Back!</h2>
          <p style={subTitleStyle}>
            Here's a quick overview of your application status.
          </p>
        </div>

        <div className="styled-card" style={{ marginBottom: "32px" }}>
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "#1f2937",
              marginBottom: "4px",
            }}
          >
            Revenue Overview
          </h3>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#6b7280",
              marginBottom: "16px",
            }}
          >
            Last 30 days
          </p>
          <div style={chartPlaceholderStyle}>
            {" "}
            {/* Applied new style */}
            <BarChart3 size={48} style={chartIconStyle} />
            <p style={{ fontSize: "0.875rem" }}>Chart Data Coming Soon</p>
          </div>
        </div>

        <div style={gridStyle}>
          <Card
            title="Manage Invoices"
            icon={FileText}
            description="View, create, and send invoices to your clients efficiently."
          />
          <Card
            title="Customer Profiles"
            icon={Users}
            description="Access and manage detailed profiles of all your customers."
          />
          <Card
            title="Payment Settings"
            icon={CreditCard}
            description="Configure payment gateways and manage subscription plans."
          />
        </div>
      </main>

      {supabaseInitialized ? (
        <>
          <FloatingFeedbackButton onClick={openModal} />
          <FeedbackModal isOpen={isModalOpen} onClose={closeModal} />
        </>
      ) : (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "#dc2626",
            color: "white",
            fontWeight: 600,
            padding: "12px 20px",
            borderRadius: "50px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            zIndex: 40,
          }}
        >
          <AlertTriangle size={20} style={{ marginRight: "8px" }} />
          Feedback Tool Unavailable
        </div>
      )}
    </div>
  );
};

export default App;
