import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { sendCertificate } from "../utils/sendCertificate.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

export const generateCertificateController = async (req, res) => {
  try {
    const { email, courseName, xp } = req.body;
    const { firstName, lastName } = req.user;
    const name = `${firstName} ${lastName}`.trim();


    // Generate Certificate ID
    const certificateId = `TLS-${uuidv4().split("-")[0].toUpperCase()}`;

    const templatePath = `./templates/template-${courseName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    const fontPath = path.resolve("./fonts/BDScript-Regular.ttf");

    const templateBytes = fs.readFileSync(templatePath);
    const fontBytes = fs.readFileSync(fontPath);

    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    const slightFont = await pdfDoc.embedFont(fontBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Student Name - Centered

    // Get dimensions
    const fontSize = 50;
    const pageWidth = firstPage.getWidth();
    const textWidth = slightFont.widthOfTextAtSize(name, fontSize);

    // Calculate center X
    const x = (pageWidth - textWidth) / 2;
    const y = 250; 

    firstPage.drawText(name, {
      x,
      y,
      size: fontSize,
      font: slightFont,
      color: rgb(14 / 255, 25 / 255, 109 / 255),
    });

    // ➤ Certificate ID - Bottom Right
    firstPage.drawText(`${certificateId}`, {
      x: 628,       // adjust depending on template width
      y: 103,
      size: 10,
      color: rgb(14 / 255, 25 / 255, 109 / 255)
    });

    // ➤ Issue Date - Bottom Left
    firstPage.drawText(`${new Date().toLocaleDateString("en-IN")}`, {
      x: 275,
      y: 103,
      size: 10,
      color: rgb(14 / 255, 25 / 255, 109 / 255)
    });

    const finalPdfBuffer = await pdfDoc.save();

    // Upload to Cloudinary
    const fileName = `certificates/${courseName}-${name}.pdf`;
    const uploadResult = await uploadToCloudinary(finalPdfBuffer, fileName);
    const cloudinaryUrl = uploadResult.secure_url; 

// Send Email
await sendCertificate({
  name,
  email,
  courseName,
  xp,
  buffer: Buffer.from(finalPdfBuffer),
  certificateId,
  cloudUrl: cloudinaryUrl,
});

// Send response
return res.status(200).json({
  message: "Certificate generated and emailed successfully",
  certificateId,
  url: cloudinaryUrl, 
});

  } catch (err) {
    console.error("Certificate generation error:", err);
    return res.status(500).json({ error: "Failed to generate/send certificate" });
  }
};
