import express from "express";
import userRoutes from "./routes/UserRoutes";

const app = express();
app.use(express.json()); // Permite receber JSON do Front-end

// Configurando o endereço base para usuários
app.use("/users", userRoutes);

export default app;
