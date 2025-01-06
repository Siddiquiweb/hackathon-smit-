const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], 
  totalPrice: Number,
  orderDate: Date,
  status: { type: String, default: 'pending' },
});
