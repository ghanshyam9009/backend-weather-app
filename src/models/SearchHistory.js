import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true,
    },
    locationName: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    condition: {
      type: String,
      required: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("SearchHistory", searchHistorySchema);

