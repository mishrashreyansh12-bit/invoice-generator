import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Models
import Client from "./models/Client.js";
import Invoice from "./models/Invoice.js";
import Settings from "./models/Settings.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/innvoice";

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB successfully!");
    await seedDatabase();
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });

// Database Seed Logic
async function seedDatabase() {
  try {
    const clientsCount = await Client.countDocuments();
    const settingsCount = await Settings.countDocuments();

    if (clientsCount === 0 && settingsCount === 0) {
      console.log("Database is empty. Seeding initial mock data...");

      // 1. Create Default Settings
      const defaultSettings = await Settings.create({
        companyName: "Acme Creative Studio Ltd.",
        companyEmail: "hello@acmecreative.com",
        companyPhone: "+1 (555) 019-2834",
        companyAddress: "128 Innovation Way, Suite 400\nSan Francisco, CA 94107",
        companyTaxId: "US-987654321",
        companyWebsite: "www.acmecreative.com",
        defaultCurrency: "USD",
        defaultTaxRate: 10,
        defaultPaymentTerms: "NET 30",
        bankName: "Silicon Valley Bank",
        bankAccountName: "Acme Creative Studio Operating AC",
        bankAccountNumber: "•••• •••• •••• 9823",
        bankRoutingCode: "021000021"
      });

      // 2. Create Clients
      const client1 = await Client.create({
        name: "Helix Therapeutics Inc.",
        email: "billing@helixrx.com",
        phone: "+1 (555) 123-4567",
        address: "450 Science Parkway, Building B\nBoston, MA 02111",
        taxId: "US-123456789",
        notes: "Requires PO number on all invoices."
      });

      const client2 = await Client.create({
        name: "Nebula Ventures LLC",
        email: "finance@nebulavc.com",
        phone: "+1 (555) 987-6543",
        address: "99 Infinite Loop, Floor 3\nAustin, TX 78701",
        taxId: "US-456789012",
        notes: "Sends automatic payments on the 1st of the month."
      });

      const client3 = await Client.create({
        name: "Aether Design Agency",
        email: "hello@aetherdesign.io",
        phone: "+44 20 7946 0958",
        address: "74 Shoreditch High St\nLondon, E1 6JJ\nUnited Kingdom",
        taxId: "GB-887766554",
        notes: "UK VAT client."
      });

      // 3. Create Invoices
      await Invoice.create([
        {
          invoiceNumber: "INV-2026-001",
          clientId: client1._id,
          createdDate: "2026-04-15",
          dueDate: "2026-05-15",
          status: "paid",
          currency: "USD",
          items: [
            {
              description: "Enterprise UI/UX Design System Rebuild",
              quantity: 1,
              price: 8500,
              taxRate: 10,
              discountRate: 0
            },
            {
              description: "Front-end Development Engineering Support (40 hours @ $125/hr)",
              quantity: 40,
              price: 125,
              taxRate: 10,
              discountRate: 5
            }
          ],
          subtotal: 13500,
          taxTotal: 1325,
          discountTotal: 250,
          total: 14575,
          notes: "Thank you for your business!",
          paymentTerms: "NET 30"
        },
        {
          invoiceNumber: "INV-2026-002",
          clientId: client2._id,
          createdDate: "2026-05-01",
          dueDate: "2026-05-31",
          status: "sent",
          currency: "USD",
          items: [
            {
              description: "Q2 Brand Strategy & Market Positioning Consultancy",
              quantity: 1,
              price: 5000,
              taxRate: 10,
              discountRate: 0
            }
          ],
          subtotal: 5000,
          taxTotal: 500,
          discountTotal: 0,
          total: 5500,
          notes: "Bank transfer details are listed below.",
          paymentTerms: "NET 30"
        },
        {
          invoiceNumber: "INV-2026-003",
          clientId: client3._id,
          createdDate: "2026-05-10",
          dueDate: "2026-06-10",
          status: "draft",
          currency: "USD",
          items: [
            {
              description: "Illustrative Vector Icons Pack (Custom Customization)",
              quantity: 12,
              price: 150,
              taxRate: 10,
              discountRate: 10
            }
          ],
          subtotal: 1800,
          taxTotal: 162,
          discountTotal: 180,
          total: 1782,
          notes: "Draft invoice for review prior to final distribution.",
          paymentTerms: "NET 30"
        },
        {
          invoiceNumber: "INV-2026-004",
          clientId: client1._id,
          createdDate: "2026-03-10",
          dueDate: "2026-04-10",
          status: "overdue",
          currency: "USD",
          items: [
            {
              description: "React Native Mobile App Prototype Integration",
              quantity: 1,
              price: 7500,
              taxRate: 10,
              discountRate: 0
            }
          ],
          subtotal: 7500,
          taxTotal: 750,
          discountTotal: 0,
          total: 8250,
          notes: "OVERDUE INVOICE. Please remit outstanding balance immediately.",
          paymentTerms: "NET 30"
        }
      ]);

      console.log("Database seeded successfully!");
    }
  } catch (error) {
    console.error("Database seeding failed:", error);
  }
}

// -------------------------------------------------------------
// CLIENTS API ENDPOINTS
// -------------------------------------------------------------

app.get("/api/clients", async (req, res) => {
  try {
    const clients = await Client.find().sort({ name: 1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

app.get("/api/clients/:id", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch client" });
  }
});

app.post("/api/clients", async (req, res) => {
  try {
    const { name, email, phone, address, taxId, notes } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }
    const client = await Client.create({ name, email, phone, address, taxId, notes });
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: "Failed to create client" });
  }
});

app.put("/api/clients/:id", async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: "Failed to update client" });
  }
});

app.delete("/api/clients/:id", async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json({ success: true, message: "Client deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete client" });
  }
});

// -------------------------------------------------------------
// INVOICES API ENDPOINTS
// -------------------------------------------------------------

// Helper to recalculate totals
function calculateInvoiceTotals(invoice) {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  invoice.items.forEach((item) => {
    const itemSub = item.price * item.quantity;
    const itemDisc = itemSub * (item.discountRate / 100);
    const itemTax = (itemSub - itemDisc) * (item.taxRate / 100);

    subtotal += itemSub;
    discountTotal += itemDisc;
    taxTotal += itemTax;
  });

  invoice.subtotal = parseFloat(subtotal.toFixed(2));
  invoice.discountTotal = parseFloat(discountTotal.toFixed(2));
  invoice.taxTotal = parseFloat(taxTotal.toFixed(2));
  invoice.total = parseFloat((subtotal - discountTotal + taxTotal).toFixed(2));
}

app.get("/api/invoices", async (req, res) => {
  try {
    const invoices = await Invoice.find().populate("clientId").sort({ createdAt: -1 });

    // Auto check for overdue statuses
    const today = new Date().toISOString().split("T")[0];
    let changed = false;

    const promises = invoices.map(async (inv) => {
      if (inv.status === "sent" && inv.dueDate < today) {
        inv.status = "overdue";
        changed = true;
        await inv.save();
      }
      return inv;
    });

    const updatedInvoices = await Promise.all(promises);
    res.json(updatedInvoices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

app.get("/api/invoices/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("clientId");
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

app.post("/api/invoices", async (req, res) => {
  try {
    const invoiceData = req.body;
    if (!invoiceData.invoiceNumber || !invoiceData.clientId || !invoiceData.items || !invoiceData.items.length) {
      return res.status(400).json({ error: "Missing required invoice details" });
    }

    // Check unique invoice number
    const existing = await Invoice.findOne({ invoiceNumber: invoiceData.invoiceNumber });
    if (existing) {
      return res.status(400).json({ error: `Invoice number ${invoiceData.invoiceNumber} already exists.` });
    }

    calculateInvoiceTotals(invoiceData);
    const invoice = await Invoice.create(invoiceData);
    res.status(201).json(invoice);
  } catch (error) {
    console.error("POST Invoice Error:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

app.put("/api/invoices/:id", async (req, res) => {
  try {
    const invoiceData = req.body;
    calculateInvoiceTotals(invoiceData);

    const invoice = await Invoice.findByIdAndUpdate(req.params.id, invoiceData, { new: true });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

app.delete("/api/invoices/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json({ success: true, message: "Invoice deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

// -------------------------------------------------------------
// SETTINGS API ENDPOINTS
// -------------------------------------------------------------

app.get("/api/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        companyName: "Acme Creative Studio Ltd.",
        companyEmail: "hello@acmecreative.com",
        companyPhone: "+1 (555) 019-2834",
        companyAddress: "128 Innovation Way, Suite 400\nSan Francisco, CA 94107",
        defaultCurrency: "USD",
        defaultTaxRate: 10,
        defaultPaymentTerms: "NET 30"
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      settings = await Settings.findByIdAndUpdate(settings._id, req.body, { new: true });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running in development mode on port ${PORT}`);
});
