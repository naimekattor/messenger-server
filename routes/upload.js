const express = require("express");
const multer = require("multer");
const cloudinary = require("../cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isPdf = file && file.mimetype === "application/pdf";
    const isDocument =
      file &&
      (file.mimetype === "application/pdf" ||
        file.mimetype === "application/msword" ||
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.mimetype === "text/plain" ||
        file.mimetype.startsWith("application/"));

    return {
      folder: "chat_uploads",
      resource_type: isDocument ? "raw" : "auto",
      // Add original filename to public_id for better identification
      public_id: `${Date.now()}_${file.originalname.split(".")[0]}`,
    };
  },
});

const parser = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"), false);
    }
  },
});

router.post("/", parser.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const originalFilename = req.file.originalname || "download";
  const fileType = req.file.mimetype;

  // Check if it's a document (not an image)
  const isDocument = !fileType.startsWith("image/");
  const isPdf = fileType === "application/pdf";

  console.log("📁 File details:", {
    originalname: originalFilename,
    mimetype: fileType,
    resource_type: req.file.resource_type,
    isDocument,
    isPdf,
  });

  // Create proper URLs based on file type
  let viewUrl = req.file.path;
  let downloadUrl = req.file.path;

  if (isDocument) {
    // Get the public_id (remove the version and format)
    const publicId = req.file.public_id || req.file.filename;

    // For documents, create a download URL with proper attachment header
    downloadUrl = cloudinary.url(publicId, {
      resource_type: "raw",
      flags: `attachment:${originalFilename}`,
    });

    // For viewing (especially PDFs)
    viewUrl = cloudinary.url(publicId, {
      resource_type: "raw",
    });
  }

  res.json({
    url: viewUrl,
    downloadUrl: downloadUrl,
    public_id: req.file.public_id || req.file.filename,
    originalName: originalFilename,
    fileType: fileType,
    fileSize: req.file.size,
    isDocument: isDocument,
    isPdf: isPdf,
  });
});

// Error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size is 10MB." });
    }
  }

  if (error.message === "File type not allowed") {
    return res.status(400).json({ error: "File type not allowed" });
  }

  res.status(500).json({ error: "Upload failed" });
});

module.exports = router;
