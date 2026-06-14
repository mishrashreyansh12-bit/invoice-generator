import React, { useEffect, useState } from "react";

export default function Navigation({ currentPage, setCurrentPage }) {
  const [companyInfo, setCompanyInfo] = useState({
    companyName: "Acme Studio",
    companyEmail: "hello@acme.com",
  });

  useEffect(() => {
    // Fetch settings to display the user's business name and email in the sidebar
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.companyName) {
          setCompanyInfo({
            companyName: data.companyName,
            companyEmail: data.companyEmail || "billing@company.com",
          });
        }
      })
      .catch((err) => console.error("Error loading sidebar settings:", err));
  }, [currentPage]); // Refresh settings details when page changes

  const navItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      id: "invoices",
      name: "Invoices",
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      ),
    },
    {
      id: "clients",
      name: "Clients",
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: "settings",
      name: "Settings",
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const isTabActive = (tabId) => {
    if (tabId === "dashboard" && currentPage === "dashboard") return true;
    if (tabId === "invoices" && (currentPage === "invoices" || currentPage === "invoice-detail" || currentPage === "invoice-editor")) return true;
    if (tabId === "clients" && currentPage === "clients") return true;
    if (tabId === "settings" && currentPage === "settings") return true;
    return false;
  };

  return (
    <aside className="sidebar no-print">
      <div>
        <div className="brand-section">
          <div className="brand-icon">V</div>
          <span className="brand-name">InnVoice</span>
        </div>

        <nav>
          <ul className="nav-links">
            {navItems.map((item) => (
              <li
                key={item.id}
                className={`nav-item ${isTabActive(item.id) ? "active" : ""}`}
              >
                <button onClick={() => setCurrentPage(item.id)}>
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="profile-summary">
          <div className="profile-avatar">
            {getInitials(companyInfo.companyName)}
          </div>
          <div className="profile-details">
            <h4>{companyInfo.companyName}</h4>
            <p>{companyInfo.companyEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
