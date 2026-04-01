import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn("MONGODB_URI is not set. Search history will be disabled.");
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    console.warn("MongoDB connection failed. App will continue without history storage.");
    console.warn(error.message);
  }
};

export default connectDB;

