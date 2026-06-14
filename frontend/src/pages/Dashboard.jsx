import React, { useEffect, useState, useRef } from "react";

// Inline mouse tilt controller for 3D cards
function StatCard3D({ title, value, meta, trend, pillText, statusClass, statStyleClass }) {
  const cardRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState("");

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Mouse coords relative to card center
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    // Degree limits for rotation
    const rX = -(mouseY / (height / 2)) * 12; // max 12 deg
    const rY = (mouseX / (width / 2)) * 12;  // max 12 deg
    
    setTransformStyle(`rotateX(${rX}deg) rotateY(${rY}deg) translateZ(10px)`);
  };

  const handleMouseLeave = () => {
    setTransformStyle("");
  };

  return (
    <div className="perspective-container">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`tilt-card ${statStyleClass || ""}`}
        style={{ transform: transformStyle }}
      >
        <div className="stat-header tilt-depth-sm">
          <span className="stat-title">{title}</span>
          {pillText && (
            <div className={`status-pill ${statusClass}`} style={{ padding: "3px 8px" }}>
              {pillText}
            </div>
          )}
        </div>
        <div className="stat-value tilt-depth-md">{value}</div>
        <div className="stat-meta tilt-depth-sm">
          {trend && <span className="stat-trend-up">{trend}</span>} {meta}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ setCurrentPage, setSelectedInvoiceId }) {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

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
        console.error("Error loading dashboard data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", fontSize: "1.2rem", color: "var(--text-secondary)" }}>
        Loading dashboard analytics...
      </div>
    );
  }

  // Calculations
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.status !== "draft" ? inv.total : 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.status === "paid" ? inv.total : 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.status === "sent" ? inv.total : 0), 0);
  const totalOverdue = invoices.reduce((sum, inv) => sum + (inv.status === "overdue" ? inv.total : 0), 0);

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

  // Monthly revenue math
  const getMonthlyRevenue = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dataMap = {};
    const today = new Date();
    
    // Past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
      dataMap[label] = 0;
    }

    invoices.forEach((inv) => {
      if (inv.status === "paid" && inv.createdDate) {
        const date = new Date(inv.createdDate);
        const label = `${months[date.getMonth()]} ${date.getFullYear()}`;
        if (label in dataMap) {
          dataMap[label] += inv.total;
        }
      }
    });

    return Object.keys(dataMap).map((key) => ({
      month: key,
      revenue: dataMap[key]
    }));
  };

  const chartData = getMonthlyRevenue();
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1000);

  // SVG Chart points
  const width = 600;
  const height = 150;
  const paddingX = 40;
  const paddingY = 20;

  const points = chartData.map((d, index) => {
    const x = paddingX + (index * (width - paddingX * 2)) / (chartData.length - 1);
    const y = height - paddingY - (d.revenue / maxRevenue) * (height - paddingY * 2);
    return { x, y, label: d.month, value: d.revenue };
  });

  const linePath = points.length > 0
    ? points.reduce((path, p, i) => path + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), "")
    : "";

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : "";

  const viewInvoiceDetails = (id) => {
    setSelectedInvoiceId(id);
    setCurrentPage("invoice-detail");
  };

  return (
    <div>
      <header className="page-header">
        <div className="page-title-area">
          <h1>Dashboard</h1>
          <p>Welcome back! Let's check your business financials and transaction listings.</p>
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

      {/* Metrics Row using 3D tilt cards */}
      <section className="stats-grid">
        <StatCard3D
          title="Total Paid"
          value={formatCurrency(totalPaid)}
          pillText="Received"
          statusClass="status-paid"
          trend="↑ 12%"
          meta="vs last month"
        />
        <StatCard3D
          title="Outstanding"
          value={formatCurrency(totalOutstanding)}
          pillText="Pending"
          statusClass="status-sent"
          statStyleClass="stat-pending"
          meta={`${invoices.filter(i => i.status === "sent").length} invoices pending`}
        />
        <StatCard3D
          title="Overdue"
          value={formatCurrency(totalOverdue)}
          pillText="Unpaid"
          statusClass="status-overdue"
          statStyleClass="stat-overdue"
          meta="Action required"
        />
        <StatCard3D
          title="Total Invoiced"
          value={formatCurrency(totalInvoiced)}
          pillText="Active"
          statusClass="status-draft"
          meta="Total sales generated"
        />
      </section>

      {/* Graphs & Stats */}
      <section className="dashboard-grid">
        <div className="card">
          <div className="card-header-area">
            <h3 className="card-title">Revenue Analytics</h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Monthly Paid Earnings</span>
          </div>

          <div className="chart-container">
            <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`}>
              <defs>
                <linearGradient id="chart-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <linearGradient id="chart-area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingY + ratio * (height - paddingY * 2);
                return (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    className="chart-grid-line"
                  />
                );
              })}

              {/* Area */}
              {areaPath && <path d={areaPath} className="chart-path-area" />}

              {/* Line */}
              {linePath && <path d={linePath} className="chart-path-line" />}

              {/* Hover nodes */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    className="chart-dot"
                  />
                  <title>{`${p.label}: ${formatCurrency(p.value)}`}</title>
                </g>
              ))}
            </svg>
            <div className="chart-labels-x">
              {chartData.map((d, i) => (
                <span key={i}>{d.month}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header-area">
            <h3 className="card-title">Quick Stats</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Total Clients</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{clients.length} Active</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Draft Invoices</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                {invoices.filter((i) => i.status === "draft").length} Saved
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <span style={{ color: "var(--text-secondary)" }}>Paid Ratio</span>
              <span style={{ fontWeight: 600, color: "var(--status-paid-text)" }}>
                {invoices.length > 0
                  ? Math.round((invoices.filter((i) => i.status === "paid").length / invoices.length) * 100)
                  : 0}
                %
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)" }}>Avg Invoice Value</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                {formatCurrency(invoices.length > 0 ? totalInvoiced / invoices.length : 0)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Invoices Table */}
      <section className="card">
        <div className="card-header-area">
          <h3 className="card-title">Recent Invoices</h3>
          <button onClick={() => setCurrentPage("invoices")} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 550, fontSize: "0.85rem", cursor: "pointer" }}>
            View All Invoices →
          </button>
        </div>

        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Client Name</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 5).map((inv) => (
                <tr key={inv._id}>
                  <td>
                    <button onClick={() => viewInvoiceDetails(inv._id)} className="invoice-number-link" style={{ background: "none", border: "none", fontSize: "0.9rem", textAlign: "left" }}>
                      {inv.invoiceNumber}
                    </button>
                  </td>
                  <td>{getClientName(inv.clientId)}</td>
                  <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(inv.total)}</td>
                  <td>
                    <span className={`status-pill status-${inv.status}`}>{inv.status}</span>
                  </td>
                  <td>
                    <button onClick={() => viewInvoiceDetails(inv._id)} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "underline", cursor: "pointer" }}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                    No invoices generated yet. Click 'Create Invoice' to generate your first transaction!
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
