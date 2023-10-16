import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });


const authAndSave = async (req, res, next) => {
    try {
      const token = req.cookies.jwt;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userEmail = decoded.email;
        next();
      } else {
        res.send("unautherized entry");
      }
    } catch (err) {
      console.error(err);
      res.status(401).json({ error: "Invalid token" });
    }
  };

  export {authAndSave};