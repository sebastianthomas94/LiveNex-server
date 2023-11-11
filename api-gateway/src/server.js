import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import proxy from "express-http-proxy";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });
import cors from "cors";
import { uploadtos3 } from "./controllers/uploadVideo.js";
import multer from "multer";

// Set up the storage location and filename for uploaded video files
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "./public/videos"); // Files will be stored in the 'uploads/videos' directory
//   },
//   filename: function (req, file, cb) {
//     const fileName = file.fieldname + "-" + Date.now() + path.extname(file.originalname);
//     req.fileName = fileName;
//     cb(
//       null,
//       fileName
//     );
//     // The filename will consist of the fieldname, current date-time, and original extension
//   },
// });
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "*",
    credentials: true,
  })
);
app.use("/user", proxy(process.env.USER_URL));

app.use("/stream", proxy(process.env.LIVE_URL));

app.use("/uploadvideo", upload.single("file"), uploadtos3);

app.listen(process.env.PORT, () =>
  console.log(`gateway server started at ${process.env.PORT}`)
);
