const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  specialist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  dateRange: {
    from: { type: Date, required: true },
    to:   { type: Date, required: true }
  },
  appointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }],
  totalRevenue: {
    type: Number,
    required: true
  },
  commissionPercentage: {
    type: Number,
    required: true
  },
  totalCommission: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pagado', 'pendiente'],
    default: 'pagado'
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Settlement', settlementSchema);
