import React, { useState } from "react";
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import InvoiceEditor from "./pages/InvoiceEditor";
import Clients from "./pages/Clients";
import Settings from "./pages/Settings";
import "./App.css";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Router dispatcher
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            setCurrentPage={setCurrentPage}
            setSelectedInvoiceId={setSelectedInvoiceId}
          />
        );
      case "invoices":
        return (
          <Invoices
            setCurrentPage={setCurrentPage}
            setSelectedInvoiceId={setSelectedInvoiceId}
          />
        );
      case "invoice-detail":
        return (
          <InvoiceDetail
            selectedInvoiceId={selectedInvoiceId}
            setCurrentPage={setCurrentPage}
            setSelectedInvoiceId={setSelectedInvoiceId}
          />
        );
      case "invoice-editor":
        return (
          <InvoiceEditor
            selectedInvoiceId={selectedInvoiceId}
            setCurrentPage={setCurrentPage}
            setSelectedInvoiceId={setSelectedInvoiceId}
          />
        );
      case "clients":
        return <Clients />;
      case "settings":
        return <Settings />;
      default:
        return (
          <Dashboard
            setCurrentPage={setCurrentPage}
            setSelectedInvoiceId={setSelectedInvoiceId}
          />
        );
    }
  };

  const navigateTo = (pageId) => {
    setCurrentPage(pageId);
    setMobileMenuOpen(false); // Close mobile drawer
  };

  return (
    <div className="app-container">
      {/* Mobile Top Header */}
      <div className="mobile-header no-print">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-menu-btn"
          aria-label="Toggle Navigation Menu"
        >
          ☰
        </button>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem" }}>
          InnVoice
        </div>
        <div style={{ width: "24px" }}></div> {/* Balance spacer */}
      </div>

      {/* Navigation sidebar */}
      <div className={`no-print ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <Navigation
          currentPage={currentPage}
          setCurrentPage={navigateTo}
        />
      </div>

      {/* Main scrolling viewport */}
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
