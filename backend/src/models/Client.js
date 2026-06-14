import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: String,
  address: String,
  taxId: String,
  notes: String
}, {
  timestamps: true
});

export default mongoose.model("Client", ClientSchema);
