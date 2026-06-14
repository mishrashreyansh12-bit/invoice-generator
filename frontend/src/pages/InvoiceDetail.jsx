import React, { useEffect, useState } from "react";

export default function InvoiceDetail({ selectedInvoiceId, setCurrentPage, setSelectedInvoiceId }) {
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!selectedInvoiceId) return;

    setLoading(true);
    Promise.all([
      fetch(`/api/invoices/${selectedInvoiceId}`).then((res) => {
        if (!res.ok) throw new Error("Invoice not found");
        return res.json();
      }),
      fetch("/api/settings").then((res) => res.json())
    ])
      .then(([invoiceData, settingsData]) => {
        setInvoice(invoiceData);
        setSettings(settingsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading invoice detail view:", err);
        setLoading(false);
      });
  }, [selectedInvoiceId]);

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...invoice, status: "paid" }),
      });
      if (response.ok) {
        const updated = await response.json();
        // Since populate was lost in put response, re-fetch or merge
        setInvoice({ ...updated, clientId: invoice.clientId });
      } else {
        alert("Failed to mark invoice as paid");
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsSent = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...invoice, status: "sent" }),
      });
      if (response.ok) {
        const updated = await response.json();
        setInvoice({ ...updated, clientId: invoice.clientId });
      } else {
        alert("Failed to mark invoice as sent");
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice._id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSelectedInvoiceId(null);
        setCurrentPage("invoices");
      } else {
        alert("Failed to delete invoice");
      }
    } catch (err) {
      console.error("Deletion error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", fontSize: "1.2rem", color: "var(--text-secondary)" }}>
        Loading invoice details...
      </div>
    );
  }

  if (!invoice || !settings) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "80vh", gap: "20px" }}>
        <h2 style={{ color: "var(--status-overdue-text)" }}>Invoice Not Found</h2>
        <p>The requested invoice could not be located in the database.</p>
        <button onClick={() => setCurrentPage("invoices")} className="btn btn-primary">
          Back to Invoices
        </button>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: invoice.currency || "USD",
    }).format(val);
  };

  const client = invoice.clientId || { name: "Unknown Client", email: "", address: "" };

  return (
    <div>
      {/* Header controls - Hidden during print */}
      <header className="page-header no-print">
        <div className="page-title-area">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => setCurrentPage("invoices")} style={{ background: "none", border: "none", color: "var(--text-muted)", display: "flex", alignItems: "center", cursor: "pointer" }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <h1>{invoice.invoiceNumber}</h1>
            <span className={`status-pill status-${invoice.status}`}>{invoice.status}</span>
          </div>
        </div>

        <div className="header-actions">
          <button onClick={handlePrint} className="btn btn-secondary">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print / Save PDF
          </button>
          
          {invoice.status === "draft" && (
            <button onClick={handleMarkAsSent} disabled={actionLoading} className="btn btn-secondary">
              Mark as Sent
            </button>
          )}

          {invoice.status !== "paid" && (
            <button onClick={handleMarkAsPaid} disabled={actionLoading} className="btn btn-primary">
              Mark as Paid
            </button>
          )}

          <button onClick={() => setCurrentPage("invoice-editor")} className="btn btn-secondary">
            Edit
          </button>

          <button onClick={handleDelete} disabled={actionLoading} className="btn btn-danger">
            Delete
          </button>
        </div>
      </header>

      {/* Invoice Sheet View */}
      <section className="invoice-preview-container" style={{ maxWidth: "850px", margin: "0 auto 40px auto" }}>
        <div className="invoice-sheet">
          
          {/* Company details */}
          <div className="invoice-sheet-header">
            <div className="invoice-sheet-logo-area">
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a" }}>{settings.companyName}</h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", whiteSpace: "pre-line" }}>
                {settings.companyAddress}
                {settings.companyPhone && `\nPhone: ${settings.companyPhone}`}
                {settings.companyEmail && `\nEmail: ${settings.companyEmail}`}
                {settings.companyTaxId && `\nTax ID: ${settings.companyTaxId}`}
              </p>
            </div>
            
            <div className="invoice-sheet-title">
              <h2>INVOICE</h2>
              <span>{invoice.invoiceNumber}</span>
              <p style={{ marginTop: "12px", fontSize: "0.9rem", color: "#475569" }}>
                Status: <strong style={{ textTransform: "uppercase", color: invoice.status === "paid" ? "#10b981" : "#475569" }}>{invoice.status}</strong>
              </p>
            </div>
          </div>

          {/* Metadata grid */}
          <div className="invoice-sheet-details-grid">
            <div className="invoice-sheet-party">
              <h4>Billed To</h4>
              <p>
                <strong>{client.name}</strong>
                <span style={{ whiteSpace: "pre-line", display: "block" }}>{client.address}</span>
                {client.taxId && <span style={{ display: "block", marginTop: "4px" }}>Tax ID: {client.taxId}</span>}
                {client.phone && <span style={{ display: "block" }}>Phone: {client.phone}</span>}
                {client.email && <span style={{ display: "block" }}>Email: {client.email}</span>}
              </p>
            </div>

            <div className="invoice-sheet-party">
              <h4>Date Issued</h4>
              <p>{invoice.createdDate ? new Date(invoice.createdDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "-"}</p>
              
              <h4 style={{ marginTop: "18px" }}>Payment Terms</h4>
              <p>{invoice.paymentTerms || settings.defaultPaymentTerms}</p>
            </div>

            <div className="invoice-sheet-party">
              <h4>Due Date</h4>
              <p style={{ fontWeight: 600, color: invoice.status === "overdue" ? "#ef4444" : "#0f172a" }}>
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "-"}
              </p>
            </div>
          </div>

          {/* Table */}
          <table className="invoice-sheet-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="num-col" style={{ width: "80px" }}>Qty</th>
                <th className="num-col" style={{ width: "110px" }}>Unit Price</th>
                <th className="num-col" style={{ width: "100px" }}>Discount</th>
                <th className="num-col" style={{ width: "100px" }}>Tax</th>
                <th className="num-col" style={{ width: "120px" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => {
                const itemSub = item.price * item.quantity;
                const discAmt = itemSub * (item.discountRate / 100);
                const taxAmt = (itemSub - discAmt) * (item.taxRate / 100);
                const rowTotal = itemSub - discAmt + taxAmt;

                return (
                  <tr key={item._id || idx}>
                    <td style={{ fontWeight: 550, color: "#1e293b" }}>{item.description}</td>
                    <td className="num-col">{item.quantity}</td>
                    <td className="num-col">{formatCurrency(item.price)}</td>
                    <td className="num-col" style={{ color: discAmt > 0 ? "#b45309" : "#64748b" }}>
                      {item.discountRate > 0 ? `${item.discountRate}%` : "-"}
                    </td>
                    <td className="num-col">{item.taxRate > 0 ? `${item.taxRate}%` : "-"}</td>
                    <td className="num-col" style={{ fontWeight: 600 }}>{formatCurrency(rowTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals panel */}
          <div className="invoice-sheet-totals">
            <table className="invoice-sheet-totals-table">
              <tbody>
                <tr>
                  <td>Subtotal</td>
                  <td className="amount">{formatCurrency(invoice.subtotal)}</td>
                </tr>
                {invoice.discountTotal > 0 && (
                  <tr>
                    <td>Discount Total</td>
                    <td className="amount" style={{ color: "#b45309" }}>-{formatCurrency(invoice.discountTotal)}</td>
                  </tr>
                )}
                {invoice.taxTotal > 0 && (
                  <tr>
                    <td>Tax Total</td>
                    <td className="amount">+{formatCurrency(invoice.taxTotal)}</td>
                  </tr>
                )}
                <tr className="grand-total">
                  <td>Total Due</td>
                  <td className="amount">{formatCurrency(invoice.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment info */}
          <div className="invoice-sheet-footer">
            {invoice.notes && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#64748b", marginBottom: "6px" }}>Notes / Remarks</h4>
                <p style={{ fontSize: "0.85rem", color: "#475569" }}>{invoice.notes}</p>
              </div>
            )}
            
            {settings.bankName && (
              <div>
                <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#64748b", marginBottom: "6px" }}>Payment Instructions</h4>
                <p style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.5 }}>
                  Bank: <strong>{settings.bankName}</strong><br />
                  Account Name: <strong>{settings.bankAccountName}</strong><br />
                  Account Number: <strong>{settings.bankAccountNumber}</strong><br />
                  {settings.bankRoutingCode && <>Routing Code: <strong>{settings.bankRoutingCode}</strong></>}
                </p>
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
