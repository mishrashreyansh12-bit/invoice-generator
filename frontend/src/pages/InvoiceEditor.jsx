import React, { useEffect, useState } from "react";

export default function InvoiceEditor({ selectedInvoiceId, setCurrentPage, setSelectedInvoiceId }) {
  const [clients, setClients] = useState([]);
  const [settings, setSettings] = useState(null);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [createdDate, setCreatedDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("draft");
  const [currency, setCurrency] = useState("USD");
  const [paymentTerms, setPaymentTerms] = useState("NET 30");
  const [notes, setNotes] = useState("Thank you for your business!");
  const [items, setItems] = useState([
    { id: "item-1", description: "", quantity: 1, price: 0, taxRate: 0, discountRate: 0 }
  ]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Quick Client Modal
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [newClientTaxId, setNewClientTaxId] = useState("");
  const [clientSaving, setClientSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clientsRes, settingsRes, invoicesRes] = await Promise.all([
          fetch("/api/clients").then((res) => res.json()),
          fetch("/api/settings").then((res) => res.json()),
          fetch("/api/invoices").then((res) => res.json())
        ]);

        setClients(clientsRes);
        setSettings(settingsRes);

        if (selectedInvoiceId) {
          // Edit Mode
          const editRes = await fetch(`/api/invoices/${selectedInvoiceId}`);
          if (editRes.ok) {
            const editInv = await editRes.json();
            setInvoiceNumber(editInv.invoiceNumber);
            setSelectedClientId(editInv.clientId._id || editInv.clientId);
            setCreatedDate(editInv.createdDate);
            setDueDate(editInv.dueDate);
            setStatus(editInv.status);
            setCurrency(editInv.currency || "USD");
            setPaymentTerms(editInv.paymentTerms || "NET 30");
            setNotes(editInv.notes || "");
            
            // Map Mongoose _id or use id
            const mappedItems = editInv.items.map((item) => ({
              id: item._id || item.id || `item-${Math.random()}`,
              description: item.description,
              quantity: item.quantity,
              price: item.price,
              taxRate: item.taxRate,
              discountRate: item.discountRate
            }));
            setItems(mappedItems);
          }
        } else {
          // Create Mode
          const today = new Date().toISOString().split("T")[0];
          setCreatedDate(today);

          const future = new Date();
          future.setDate(future.getDate() + 30);
          setDueDate(future.toISOString().split("T")[0]);

          setCurrency(settingsRes.defaultCurrency || "USD");
          setPaymentTerms(settingsRes.defaultPaymentTerms || "NET 30");
          setNotes("Thank you for your business!");

          // Auto-generate invoice number
          let nextNum = "INV-2026-001";
          if (invoicesRes && invoicesRes.length > 0) {
            const nums = invoicesRes.map((inv) => {
              const parts = inv.invoiceNumber.split("-");
              const val = parseInt(parts[parts.length - 1]);
              return isNaN(val) ? 0 : val;
            });
            const maxVal = Math.max(...nums, 0);
            nextNum = `INV-2026-${String(maxVal + 1).padStart(3, "0")}`;
          }
          setInvoiceNumber(nextNum);
          if (clientsRes.length > 0) {
            setSelectedClientId(clientsRes[0]._id);
          }

          setItems([
            { id: `item-${Date.now()}`, description: "", quantity: 1, price: 0, taxRate: settingsRes.defaultTaxRate || 0, discountRate: 0 }
          ]);
        }
      } catch (err) {
        console.error("Error loading forms configuration:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedInvoiceId]);

  const handleTermsChange = (terms) => {
    setPaymentTerms(terms);
    const days = parseInt(terms.replace(/\D/g, ""));
    if (isNaN(days) || !createdDate) return;

    const baseDate = new Date(createdDate);
    baseDate.setDate(baseDate.getDate() + days);
    setDueDate(baseDate.toISOString().split("T")[0]);
  };

  const handleCreatedDateChange = (date) => {
    setCreatedDate(date);
    const days = parseInt(paymentTerms.replace(/\D/g, ""));
    if (isNaN(days) || !date) return;

    const baseDate = new Date(date);
    baseDate.setDate(baseDate.getDate() + days);
    setDueDate(baseDate.toISOString().split("T")[0]);
  };

  const handleItemChange = (id, field, value) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        description: "",
        quantity: 1,
        price: 0,
        taxRate: settings?.defaultTaxRate || 0,
        discountRate: 0
      }
    ]);
  };

  const removeItemRow = (id) => {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  // Calculations math
  const calculateTotals = () => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    items.forEach((item) => {
      const itemSub = item.price * item.quantity;
      const itemDisc = itemSub * (item.discountRate / 100);
      const itemTax = (itemSub - itemDisc) * (item.taxRate / 100);

      subtotal += itemSub;
      discountTotal += itemDisc;
      taxTotal += itemTax;
    });

    const total = subtotal - discountTotal + taxTotal;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountTotal: parseFloat(discountTotal.toFixed(2)),
      taxTotal: parseFloat(taxTotal.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  };

  const totals = calculateTotals();

  const handleQuickAddClient = async (e) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) {
      alert("Name and email are required fields.");
      return;
    }

    setClientSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClientName,
          email: newClientEmail,
          phone: newClientPhone,
          address: newClientAddress,
          taxId: newClientTaxId
        })
      });

      if (res.ok) {
        const saved = await res.json();
        setClients([...clients, saved]);
        setSelectedClientId(saved._id);
        setShowClientModal(false);
        setNewClientName("");
        setNewClientEmail("");
        setNewClientPhone("");
        setNewClientAddress("");
        setNewClientTaxId("");
      } else {
        alert("Failed to add client profile.");
      }
    } catch (err) {
      console.error("Save client profile error:", err);
    } finally {
      setClientSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert("Please select a client contact.");
      return;
    }
    if (!invoiceNumber) {
      alert("Invoice number is required.");
      return;
    }
    if (items.some((i) => !i.description.trim())) {
      alert("All line items must have a description.");
      return;
    }

    setSaving(true);
    // Format payload (delete local id key to let mongoose handle nested item schema IDs)
    const formattedItems = items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      price: i.price,
      taxRate: i.taxRate,
      discountRate: i.discountRate
    }));

    const invoicePayload = {
      invoiceNumber,
      clientId: selectedClientId,
      createdDate,
      dueDate,
      status,
      items: formattedItems,
      currency,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      total: totals.total,
      notes,
      paymentTerms
    };

    try {
      const url = selectedInvoiceId ? `/api/invoices/${selectedInvoiceId}` : "/api/invoices";
      const method = selectedInvoiceId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoicePayload)
      });

      if (res.ok) {
        const saved = await res.json();
        setSelectedInvoiceId(saved._id);
        setCurrentPage("invoice-detail");
      } else {
        const err = await res.json();
        alert(`Failed to save invoice: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Submit invoice error:", err);
      alert("Network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const activeClient = clients.find((c) => c._id === selectedClientId);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(val);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", fontSize: "1.2rem", color: "var(--text-secondary)" }}>
        Configuring editor environment...
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <div className="page-title-area">
          <h1>{selectedInvoiceId ? "Edit Invoice" : "Create Invoice"}</h1>
          <p>Compose client transaction invoices with real-time preview layouts.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="editor-layout">
        
        {/* LEFT COLUMN */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <h3 className="card-title" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "14px" }}>Invoice Configuration</h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="form-select"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="INR">INR (₹)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              Select Client Contact
              <button
                type="button"
                onClick={() => setShowClientModal(true)}
                style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
              >
                + Quick Add Client
              </button>
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="form-select"
              required
            >
              <option value="">-- Choose a Client --</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Issue Date</label>
              <input
                type="date"
                value={createdDate}
                onChange={(e) => handleCreatedDateChange(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => handleTermsChange(e.target.value)}
                className="form-select"
              >
                <option value="DUE ON RECEIPT">Due on Receipt</option>
                <option value="NET 15">Net 15 Days</option>
                <option value="NET 30">Net 30 Days</option>
                <option value="NET 45">Net 45 Days</option>
                <option value="NET 60">Net 60 Days</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="form-select"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Line items dynamic grid */}
          <div className="items-list-container">
            <h3 className="card-title" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", marginBottom: "14px" }}>Line Items</h3>
            
            <div className="items-grid-header">
              <span>Item Description</span>
              <span style={{ textAlign: "right" }}>Qty</span>
              <span style={{ textAlign: "right" }}>Price</span>
              <span style={{ textAlign: "right" }}>Disc %</span>
              <span style={{ textAlign: "right" }}>Tax %</span>
              <span></span>
            </div>

            {items.map((item) => (
              <div key={item.id} className="item-row">
                <input
                  type="text"
                  placeholder="Service description"
                  value={item.description}
                  onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                  className="form-input"
                  style={{ padding: "8px 10px", fontSize: "0.85rem" }}
                  required
                />
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(item.id, "quantity", parseInt(e.target.value) || 0)}
                  className="form-input"
                  style={{ padding: "8px 10px", fontSize: "0.85rem", textAlign: "right" }}
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => handleItemChange(item.id, "price", parseFloat(e.target.value) || 0)}
                  className="form-input"
                  style={{ padding: "8px 10px", fontSize: "0.85rem", textAlign: "right" }}
                  required
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={item.discountRate}
                  onChange={(e) => handleItemChange(item.id, "discountRate", parseFloat(e.target.value) || 0)}
                  className="form-input"
                  style={{ padding: "8px 10px", fontSize: "0.85rem", textAlign: "right" }}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={item.taxRate}
                  onChange={(e) => handleItemChange(item.id, "taxRate", parseFloat(e.target.value) || 0)}
                  className="form-input"
                  style={{ padding: "8px 10px", fontSize: "0.85rem", textAlign: "right" }}
                />
                <button
                  type="button"
                  onClick={() => removeItemRow(item.id)}
                  disabled={items.length === 1}
                  className="item-delete-btn"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addItemRow}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: "16px" }}
            >
              + Add Item Row
            </button>
          </div>

          <div className="form-group" style={{ marginTop: "10px" }}>
            <label className="form-label">Notes & Terms Remarks</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
              placeholder="Provide bank routing details, SWIFT routing details..."
            />
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
            <button
              type="button"
              onClick={() => { setSelectedInvoiceId(null); setCurrentPage("invoices"); }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? "Saving..." : "Save Invoice"}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN (Live Preview) */}
        <div className="invoice-preview-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignContent: "center", marginBottom: "14px" }}>
            <h3 className="card-title" style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>Live Preview</h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>A4 Print Mode Sheet</span>
          </div>

          <div className="invoice-sheet" style={{ transform: "scale(0.95)", transformOrigin: "top center", minHeight: "800px" }}>
            <div className="invoice-sheet-header" style={{ paddingBottom: "18px", marginBottom: "20px" }}>
              <div className="invoice-sheet-logo-area">
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>{settings?.companyName || "Your Studio Ltd."}</h2>
                <p style={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "pre-line" }}>
                  {settings?.companyAddress || "Your Company Address will load here."}
                </p>
              </div>
              <div className="invoice-sheet-title" style={{ textAlign: "right" }}>
                <h2 style={{ fontSize: "1.6rem" }}>INVOICE</h2>
                <span style={{ fontSize: "0.9rem" }}>{invoiceNumber || "INV-XXXX-XXX"}</span>
              </div>
            </div>

            <div className="invoice-sheet-details-grid" style={{ marginBottom: "24px", gap: "10px" }}>
              <div className="invoice-sheet-party">
                <h4>Billed To</h4>
                {activeClient ? (
                  <p style={{ fontSize: "0.8rem" }}>
                    <strong>{activeClient.name}</strong>
                    <span style={{ whiteSpace: "pre-line", display: "block" }}>{activeClient.address}</span>
                    {activeClient.taxId && <span style={{ display: "block", marginTop: "2px" }}>Tax ID: {activeClient.taxId}</span>}
                  </p>
                ) : (
                  <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>No client selected.</p>
                )}
              </div>
              <div className="invoice-sheet-party">
                <h4>Date Issued</h4>
                <p style={{ fontSize: "0.8rem" }}>{createdDate ? new Date(createdDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}</p>
                <h4 style={{ marginTop: "10px" }}>Payment Terms</h4>
                <p style={{ fontSize: "0.8rem" }}>{paymentTerms}</p>
              </div>
              <div className="invoice-sheet-party">
                <h4>Due Date</h4>
                <p style={{ fontSize: "0.8rem", fontWeight: 600 }}>{dueDate ? new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}</p>
              </div>
            </div>

            <table className="invoice-sheet-table" style={{ marginBottom: "24px" }}>
              <thead>
                <tr>
                  <th style={{ fontSize: "0.7rem", padding: "8px 5px" }}>Description</th>
                  <th className="num-col" style={{ fontSize: "0.7rem", padding: "8px 5px", width: "40px" }}>Qty</th>
                  <th className="num-col" style={{ fontSize: "0.7rem", padding: "8px 5px", width: "80px" }}>Price</th>
                  <th className="num-col" style={{ fontSize: "0.7rem", padding: "8px 5px", width: "70px" }}>Tax</th>
                  <th className="num-col" style={{ fontSize: "0.7rem", padding: "8px 5px", width: "80px" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const sub = item.price * item.quantity;
                  const disc = sub * (item.discountRate / 100);
                  const tax = (sub - disc) * (item.taxRate / 100);
                  const total = sub - disc + tax;

                  return (
                    <tr key={item.id || idx}>
                      <td style={{ fontSize: "0.8rem", padding: "10px 5px" }}>{item.description || <span style={{ color: "#cbd5e1" }}>Description field is empty</span>}</td>
                      <td className="num-col" style={{ fontSize: "0.8rem", padding: "10px 5px" }}>{item.quantity}</td>
                      <td className="num-col" style={{ fontSize: "0.8rem", padding: "10px 5px" }}>{formatCurrency(item.price)}</td>
                      <td className="num-col" style={{ fontSize: "0.8rem", padding: "10px 5px" }}>{item.taxRate > 0 ? `${item.taxRate}%` : "-"}</td>
                      <td className="num-col" style={{ fontSize: "0.8rem", padding: "10px 5px", fontWeight: 600 }}>{formatCurrency(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="invoice-sheet-totals" style={{ marginBottom: "24px" }}>
              <table className="invoice-sheet-totals-table" style={{ width: "220px" }}>
                <tbody>
                  <tr>
                    <td style={{ fontSize: "0.8rem", padding: "6px 0" }}>Subtotal</td>
                    <td className="amount" style={{ fontSize: "0.8rem", padding: "6px 0" }}>{formatCurrency(totals.subtotal)}</td>
                  </tr>
                  {totals.discountTotal > 0 && (
                    <tr>
                      <td style={{ fontSize: "0.8rem", padding: "6px 0" }}>Discount</td>
                      <td className="amount" style={{ fontSize: "0.8rem", padding: "6px 0", color: "#b45309" }}>-{formatCurrency(totals.discountTotal)}</td>
                    </tr>
                  )}
                  {totals.taxTotal > 0 && (
                    <tr>
                      <td style={{ fontSize: "0.8rem", padding: "6px 0" }}>Tax</td>
                      <td className="amount" style={{ fontSize: "0.8rem", padding: "6px 0" }}>+{formatCurrency(totals.taxTotal)}</td>
                    </tr>
                  )}
                  <tr className="grand-total">
                    <td style={{ fontSize: "1rem", padding: "10px 0" }}>Total Due</td>
                    <td className="amount" style={{ fontSize: "1rem", padding: "10px 0", color: "#6366f1" }}>{formatCurrency(totals.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="invoice-sheet-footer" style={{ paddingTop: "14px" }}>
              {notes && (
                <div style={{ marginBottom: "10px" }}>
                  <h4 style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "3px" }}>Notes / Remarks</h4>
                  <p style={{ fontSize: "0.75rem" }}>{notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* QUICK ADD MODAL */}
      {showClientModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="card-title">Quick Add Client</h3>
              <button
                type="button"
                onClick={() => setShowClientModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleQuickAddClient}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Client Name *</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="form-input"
                    placeholder="E.g. Elon Tech Corp"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Billing Email *</label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="form-input"
                    placeholder="E.g. billing@elontech.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="form-input"
                    placeholder="E.g. +1 (555) 321-4567"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Billing Address</label>
                  <textarea
                    value={newClientAddress}
                    onChange={(e) => setNewClientAddress(e.target.value)}
                    className="form-textarea"
                    placeholder="E.g. 100 Tesla Ave, Palo Alto, CA"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax ID (VAT / GST / EIN)</label>
                  <input
                    type="text"
                    value={newClientTaxId}
                    onChange={(e) => setNewClientTaxId(e.target.value)}
                    className="form-input"
                    placeholder="E.g. VAT-8837264"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={clientSaving}
                  className="btn btn-primary"
                >
                  {clientSaving ? "Adding..." : "Add Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
