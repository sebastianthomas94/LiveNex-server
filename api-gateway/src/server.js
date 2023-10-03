import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import proxy from "express-http-proxy";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",
  methods: "*",
  credentials: true
}));
app.use("/user", proxy(process.env.USER_URL));
app.use("/stream", proxy(process.env.LIVE_URL));

app.listen(process.env.PORT, () =>
  console.log(`gateway server started at ${process.env.PORT}`)
);