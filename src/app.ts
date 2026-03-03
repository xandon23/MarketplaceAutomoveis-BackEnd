import express, { Router, Request, Response } from "express";

const app = express();
app.use(express.json());

const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("Hello MUNDO!");
});

app.use(router);

export default app;
