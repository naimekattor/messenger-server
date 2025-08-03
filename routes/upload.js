const express = require("express");
const multer = require("multer");
const cloudinary = require("../cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chat_uploads",
    resource_type: "auto",
    allowed_formats: ["jpg", "png", "mp4", "pdf", "jpeg"],
  },
});

const parser = multer({ storage });

router.post("/", parser.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  res.json({ url: req.file.path, public_id: req.file.filename });
});

module.exports = router;
