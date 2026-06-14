import React, { useEffect, useState } from "react";

export default function Invoices({ setCurrentPage, setSelectedInvoiceId }) {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/invoices").then((res) => res.json()),
      fetch("/api/clients").then((res) => res.json())
    ])
      .then(([invoiceData, clientData]) => {
        setInvoices(invoiceData);
        setClients(clientData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading invoices page data:", err);
        setLoading(false);
      });
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  const getClientName = (clientId) => {
    if (typeof clientId === "object" && clientId !== null) {
      return clientId.name;
    }
    const found = clients.find((c) => c._id === clientId);
    return found ? found.name : "Unknown Client";
  };

  const viewInvoiceDetails = (id) => {
    setSelectedInvoiceId(id);
    setCurrentPage("invoice-detail");
  };

  const editInvoiceDetails = (id) => {
    setSelectedInvoiceId(id);
    setCurrentPage("invoice-editor");
  };

  // Filters
  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    const clientName = getClientName(inv.clientId).toLowerCase();
    const invNum = inv.invoiceNumber.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = clientName.includes(query) || invNum.includes(query);
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", fontSize: "1.2rem", color: "var(--text-secondary)" }}>
        Loading invoices repository...
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <div className="page-title-area">
          <h1>Invoices</h1>
          <p>Manage, search and customize client invoices.</p>
        </div>
        <div className="header-actions">
          <button onClick={() => { setSelectedInvoiceId(null); setCurrentPage("invoice-editor"); }} className="btn btn-primary">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Invoice
          </button>
        </div>
      </header>

      {/* Filters and Search */}
      <section className="card" style={{ marginBottom: "28px", padding: "18px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          
          {/* Tabs */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
            {["all", "draft", "sent", "paid", "overdue"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`btn btn-sm ${statusFilter === status ? "btn-primary" : "btn-secondary"}`}
                style={{ textTransform: "capitalize" }}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: "relative", minWidth: "280px", flex: "1", maxWidth: "400px" }}>
            <input
              type="text"
              placeholder="Search by invoice # or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: "40px", fontSize: "0.9rem", paddingTop: "10px", paddingBottom: "10px" }}
            />
            <svg
              style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", width: "16px", height: "16px" }}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

        </div>
      </section>

      {/* Table grid */}
      <section className="card">
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Client Name</th>
                <th>Created Date</th>
                <th>Due Date</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv._id}>
                  <td>
                    <button onClick={() => viewInvoiceDetails(inv._id)} className="invoice-number-link" style={{ background: "none", border: "none", fontSize: "0.9rem", textAlign: "left" }}>
                      {inv.invoiceNumber}
                    </button>
                  </td>
                  <td>{getClientName(inv.clientId)}</td>
                  <td>{inv.createdDate ? new Date(inv.createdDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}</td>
                  <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(inv.total)}</td>
                  <td>
                    <span className={`status-pill status-${inv.status}`}>{inv.status}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button onClick={() => viewInvoiceDetails(inv._id)} className="btn btn-sm btn-secondary" style={{ padding: "6px 12px", fontSize: "0.75rem" }}>
                        View
                      </button>
                      <button onClick={() => editInvoiceDetails(inv._id)} className="btn btn-sm btn-secondary" style={{ padding: "6px 12px", fontSize: "0.75rem" }}>
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                    No invoices matching the selected filter query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
