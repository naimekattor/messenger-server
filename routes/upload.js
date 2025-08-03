const express = require("express");
const multer = require("multer");
const cloudinary = require("../cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, res) => {
    const isPdf = req.file && req.file.mimetype === "application/pdf";
    return {
      folder: "chat_uploads",
      resource_type: isPdf ? "raw" : "auto",
    };
  },
});

const parser = multer({ storage });

router.post("/", parser.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  res.json({ url: req.file.path, public_id: req.file.filename });
});

module.exports = router;
