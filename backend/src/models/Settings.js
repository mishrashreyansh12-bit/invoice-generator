import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    default: "Acme Creative Studio Ltd."
  },
  companyEmail: {
    type: String,
    required: true,
    default: "hello@acmecreative.com"
  },
  companyPhone: String,
  companyAddress: String,
  companyTaxId: String,
  companyWebsite: String,
  companyLogo: String,
  defaultCurrency: {
    type: String,
    default: "USD"
  },
  defaultTaxRate: {
    type: Number,
    default: 0
  },
  defaultPaymentTerms: {
    type: String,
    default: "NET 30"
  },
  bankName: String,
  bankAccountName: String,
  bankAccountNumber: String,
  bankRoutingCode: String
}, {
  timestamps: true
});

export default mongoose.model("Settings", SettingsSchema);
