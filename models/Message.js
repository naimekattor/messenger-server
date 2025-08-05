const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    text: { type: String }, // for text messages
    type: { type: String, default: "text" }, // text, image, video, audio, pdf, doc, etc.
    fileUrl: { type: String }, // for files
    fileType: { type: String }, // mimetype, e.g. "image/png", "application/pdf"
    fileName: { type: String }, // original file name
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
