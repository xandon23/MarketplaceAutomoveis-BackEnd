import express from "express";
import path from "path";
import UserRoutes from "./routes/UserRoutes";
import VehicleRoutes from "./routes/VehicleRoutes";
import VehicleImageRoutes from "./routes/VehicleImageRoutes";

const app = express();
app.use(express.json()); // Permite receber JSON do Front-end

app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));
app.use("/users", UserRoutes);
app.use("/vehicles", VehicleRoutes);
app.use("/images", VehicleImageRoutes);

export default app;
