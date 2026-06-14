import React, { useEffect, useState } from "react";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals form state
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCRMData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/clients").then((res) => res.json()),
      fetch("/api/invoices").then((res) => res.json())
    ])
      .then(([clientData, invoiceData]) => {
        setClients(clientData);
        setInvoices(invoiceData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading CRM clients data:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCRMData();
  }, []);

  const openAddModal = () => {
    setEditingClient(null);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setTaxId("");
    setNotes("");
    setShowModal(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone || "");
    setAddress(client.address || "");
    setTaxId(client.taxId || "");
    setNotes(client.notes || "");
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const clientInvs = invoices.filter((i) => {
      const clientIdVal = typeof i.clientId === "object" && i.clientId !== null ? i.clientId._id : i.clientId;
      return clientIdVal === id;
    });

    if (clientInvs.length > 0) {
      if (!confirm(`This client contact has ${clientInvs.length} invoice(s) associated with them. Deleting this client will leave these invoices orphaned. Are you sure you want to delete?`)) {
        return;
      }
    } else {
      if (!confirm("Are you sure you want to delete this client profile?")) return;
    }

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setClients(clients.filter((c) => c._id !== id));
      } else {
        alert("Failed to delete client contact.");
      }
    } catch (err) {
      console.error("Client deletion error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      alert("Name and email are required fields.");
      return;
    }

    setSaving(true);
    const clientPayload = {
      name,
      email,
      phone,
      address,
      taxId,
      notes
    };

    try {
      const url = editingClient ? `/api/clients/${editingClient._id}` : "/api/clients";
      const method = editingClient ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientPayload)
      });

      if (res.ok) {
        const saved = await res.json();
        if (editingClient) {
          setClients(clients.map((c) => (c._id === saved._id ? saved : c)));
        } else {
          setClients([...clients, saved]);
        }
        setShowModal(false);
      } else {
        alert("Failed to save client profile details.");
      }
    } catch (err) {
      console.error("Save client profile error:", err);
    } finally {
      setSaving(false);
    }
  };

  const getClientMetrics = (clientId) => {
    const clientInvs = invoices.filter((i) => {
      const clientIdVal = typeof i.clientId === "object" && i.clientId !== null ? i.clientId._id : i.clientId;
      return clientIdVal === clientId;
    });

    const totalBilled = clientInvs.reduce((sum, inv) => sum + (inv.status !== "draft" ? inv.total : 0), 0);
    const outstanding = clientInvs.reduce((sum, inv) => sum + (inv.status === "sent" || inv.status === "overdue" ? inv.total : 0), 0);

    return {
      invoiceCount: clientInvs.length,
      totalBilled,
      outstanding
    };
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", fontSize: "1.2rem", color: "var(--text-secondary)" }}>
        Loading client CRM directory...
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <div className="page-title-area">
          <h1>Clients</h1>
          <p>Add, edit and track client transaction history and balances.</p>
        </div>
        <div className="header-actions">
          <button onClick={openAddModal} className="btn btn-primary">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Client
          </button>
        </div>
      </header>

      {/* Grid listing */}
      <section className="clients-grid">
        {clients.map((client) => {
          const metrics = getClientMetrics(client._id);
          return (
            <div key={client._id} className="client-card">
              <div>
                <div className="client-card-header">
                  <div>
                    <h3>{client.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>{client.email}</p>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => openEditModal(client)}
                      className="btn btn-sm btn-secondary"
                      style={{ padding: "5px 8px", fontSize: "0.7rem" }}
                      title="Edit Profile"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(client._id)}
                      className="btn btn-sm btn-danger"
                      style={{ padding: "5px 8px", fontSize: "0.7rem", border: "none" }}
                      title="Delete Client"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {client.address}
                </p>
              </div>

              <div className="client-stats">
                <div className="client-stat-box">
                  <p>Invoiced Value</p>
                  <span>{formatCurrency(metrics.totalBilled)}</span>
                </div>
                <div className="client-stat-box">
                  <p>Balance Due</p>
                  <span style={{ color: metrics.outstanding > 0 ? "var(--status-overdue-text)" : "var(--text-primary)" }}>
                    {formatCurrency(metrics.outstanding)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {clients.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }} className="card">
            No client contacts added yet. Add a client to generate billing invoices.
          </div>
        )}
      </section>

      {/* ADD/EDIT CLIENT MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="card-title">{editingClient ? "Edit Client Profile" : "Add Client Contact"}</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Client Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    placeholder="E.g. Nexus Technology Corp"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Billing Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="E.g. billing@nexustech.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="form-input"
                    placeholder="E.g. +1 (555) 123-9876"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Billing Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-textarea"
                    placeholder="E.g. 500 Enterprise Way, Suite 12, Seattle, WA"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax ID (VAT / EIN / GST)</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="form-input"
                    placeholder="E.g. US-1234567"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Internal CRM Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-textarea"
                    placeholder="Additional details regarding client accounts..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? "Saving..." : "Save Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
