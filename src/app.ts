import cors from "cors";
import express from "express";
import path from "path";
import UserRoutes from "./routes/UserRoutes";
import VehicleRoutes from "./routes/VehicleRoutes";
import VehicleImageRoutes from "./routes/VehicleImageRoutes";
import ProposalRoutes from "./routes/ProposalRoutes";
import ReviewRoutes from "./routes/ReviewRoutes";
import AuthRoutes from "./routes/AuthRoutes";

const app = express();

app.use(cors());
app.use(express.json()); // Permite receber JSON do Front-end

app.use("/uploads", express.static("uploads"));
app.use("/auth", AuthRoutes);
app.use("/users", UserRoutes);
app.use("/vehicles", VehicleRoutes);
app.use("/images", VehicleImageRoutes);
app.use("/proposals", ProposalRoutes);
app.use("/reviews", ReviewRoutes);

export default app;
