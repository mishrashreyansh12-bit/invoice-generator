import React, { useEffect, useState } from "react";

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading settings:", err);
        setLoading(false);
      });
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleInputChange = (field, value) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const updated = await response.json();
        setSettings(updated);
        showToast("Settings updated successfully!");
      } else {
        alert("Failed to update settings preferences.");
      }
    } catch (err) {
      console.error("Save settings error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", fontSize: "1.2rem", color: "var(--text-secondary)" }}>
        Loading settings configuration...
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <div className="page-title-area">
          <h1>Settings</h1>
          <p>Configure company branding, local billing terms and bank routing.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{ maxWidth: "800px" }}>
        
        {/* Profile Card */}
        <section className="card" style={{ marginBottom: "28px" }}>
          <h3 className="card-title" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "20px" }}>
            Company Profile
          </h3>
          
          <div className="form-group">
            <label className="form-label">Business Name *</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Business Email *</label>
              <input
                type="email"
                value={settings.companyEmail}
                onChange={(e) => handleInputChange("companyEmail", e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Business Phone</label>
              <input
                type="text"
                value={settings.companyPhone || ""}
                onChange={(e) => handleInputChange("companyPhone", e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Website URL</label>
              <input
                type="text"
                value={settings.companyWebsite || ""}
                onChange={(e) => handleInputChange("companyWebsite", e.target.value)}
                className="form-input"
                placeholder="E.g. www.studio.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tax ID (VAT / GST / EIN)</label>
              <input
                type="text"
                value={settings.companyTaxId || ""}
                onChange={(e) => handleInputChange("companyTaxId", e.target.value)}
                className="form-input"
                placeholder="E.g. EIN-12345678"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Office Mailing Address</label>
            <textarea
              value={settings.companyAddress || ""}
              onChange={(e) => handleInputChange("companyAddress", e.target.value)}
              className="form-textarea"
              placeholder="Business physical mailing address..."
              required
            />
          </div>
        </section>

        {/* Localization Card */}
        <section className="card" style={{ marginBottom: "28px" }}>
          <h3 className="card-title" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "20px" }}>
            Localization & Invoice Defaults
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Default Currency</label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => handleInputChange("defaultCurrency", e.target.value)}
                className="form-select"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="INR">INR (₹)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Default Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.defaultTaxRate}
                onChange={(e) => handleInputChange("defaultTaxRate", parseFloat(e.target.value) || 0)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Default Payment Terms</label>
            <select
              value={settings.defaultPaymentTerms}
              onChange={(e) => handleInputChange("defaultPaymentTerms", e.target.value)}
              className="form-select"
            >
              <option value="DUE ON RECEIPT">Due on Receipt</option>
              <option value="NET 15">Net 15 Days</option>
              <option value="NET 30">Net 30 Days</option>
              <option value="NET 45">Net 45 Days</option>
              <option value="NET 60">Net 60 Days</option>
            </select>
          </div>
        </section>

        {/* Bank details Card */}
        <section className="card" style={{ marginBottom: "28px" }}>
          <h3 className="card-title" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "20px" }}>
            Bank & Remittance Details
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input
                type="text"
                value={settings.bankName || ""}
                onChange={(e) => handleInputChange("bankName", e.target.value)}
                className="form-input"
                placeholder="E.g. Chase Bank"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Beneficiary Name</label>
              <input
                type="text"
                value={settings.bankAccountName || ""}
                onChange={(e) => handleInputChange("bankAccountName", e.target.value)}
                className="form-input"
                placeholder="Name listed on bank account"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input
                type="text"
                value={settings.bankAccountNumber || ""}
                onChange={(e) => handleInputChange("bankAccountNumber", e.target.value)}
                className="form-input"
                placeholder="Bank Account Number"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Routing Code (SWIFT / Routing / IFSC)</label>
              <input
                type="text"
                value={settings.bankRoutingCode || ""}
                onChange={(e) => handleInputChange("bankRoutingCode", e.target.value)}
                className="form-input"
                placeholder="Routing Number or SWIFT Code"
              />
            </div>
          </div>
        </section>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginBottom: "40px" }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ paddingLeft: "24px", paddingRight: "24px" }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

      </form>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <svg width="20" height="20" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
