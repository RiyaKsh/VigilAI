import express, { request } from "express";
import router from "./Routes/userRoutes.mjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import adminRoutes from "./Routes/adminRoutes.mjs";
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.listen(port, () => {
    console.log(`http://127.0.0.1:${port}`);
});

app.get("/", (req, res) => {
    res.send("Hello World from Express!");
});

app.use("/api/admin", adminRoutes);
app.use("/api/users",router);

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("mongodb connected"))
    .catch((err) => console.log(`Errror agaya ${err}`));