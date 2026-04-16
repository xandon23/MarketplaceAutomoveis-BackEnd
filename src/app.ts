import cors from "cors";
import express from "express";
import UserRoutes from "./routes/UserRoutes";
import VehicleRoutes from "./routes/VehicleRoutes";
import ProposalRoutes from "./routes/ProposalRoutes";
import ReviewRoutes from "./routes/ReviewRoutes";
import AuthRoutes from "./routes/AuthRoutes";

const app = express();

app.use(cors());
app.use(express.json()); // Permite receber JSON do Front-end

app.use("/uploads", express.static("uploads"));
app.use("/auth", AuthRoutes);
app.use("/users", UserRoutes);
app.use("/vehicles", VehicleRoutes); // Agora este ficheiro gere tudo (veículos e imagens)
app.use("/proposals", ProposalRoutes);
app.use("/reviews", ReviewRoutes);

export default app;
