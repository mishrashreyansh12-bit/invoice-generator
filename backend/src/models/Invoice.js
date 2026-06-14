import mongoose from "mongoose";

const InvoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 0
  },
  discountRate: {
    type: Number,
    default: 0
  }
});

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true
  },
  createdDate: {
    type: String,
    required: true
  },
  dueDate: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["draft", "sent", "paid", "overdue"],
    default: "draft"
  },
  currency: {
    type: String,
    default: "USD"
  },
  items: [InvoiceItemSchema],
  subtotal: {
    type: Number,
    default: 0
  },
  taxTotal: {
    type: Number,
    default: 0
  },
  discountTotal: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  notes: String,
  paymentTerms: String
}, {
  timestamps: true
});

export default mongoose.model("Invoice", InvoiceSchema);
