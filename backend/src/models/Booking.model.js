import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User!']
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price.']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  paid: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'completed'],
    default: 'pending'
  },
  participants: {
    type: Number,
    required: [true, 'Booking must have number of participants'],
    min: [1, 'Booking must have at least 1 participant']
  },
  startDate: {
    type: Date,
    required: [true, 'Booking must have a start date']
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'stripe'],
    required: [true, 'Please provide a payment method']
  },
  paymentIntentId: {
    type: String,
    required: [function() { 
      return this.paymentMethod === 'stripe'; 
    }, 'Payment intent ID is required for Stripe payments']
  },
  receiptUrl: String
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Prevent duplicate bookings
bookingSchema.index({ tour: 1, user: 1 }, { unique: true });

// Populate tour and user automatically when querying
bookingSchema.pre(/^find/, function(next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name'
  });
  next();
});

// Static method to check if a tour is booked for a specific date
bookingSchema.statics.isTourBooked = async function(tourId, startDate) {
  const booking = await this.findOne({
    tour: tourId,
    startDate: {
      $gte: new Date(startDate).setHours(0, 0, 0, 0),
      $lt: new Date(startDate).setHours(23, 59, 59, 999)
    },
    status: { $ne: 'cancelled' }
  });
  return !!booking;
};

// Calculate price on save
bookingSchema.pre('save', async function(next) {
  if (this.isNew) {
    const tour = await mongoose.model('Tour').findById(this.tour);
    this.price = tour.price * this.participants;
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
