import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  project: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, default: "pending" },
});

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
