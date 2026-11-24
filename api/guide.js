const fs = require("fs");
const path = require("path");
const { checkToken } = require("./_lib");

module.exports = (req, res) => {
  try {
    if (!checkToken(req.query.t)) return res.status(403).send("Invalid or expired link.");
    const file = fs.readFileSync(path.join(process.cwd(), "private", "ClipMate-Guide.pdf"));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="ClipMate-Guide.pdf"');
    res.send(file);
  } catch (e) {
    console.error(e);
    res.status(500).send("Download failed. Please email support.");
  }
};
