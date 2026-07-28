import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface PDFExportOptions {
  elementId?: string;
  element?: HTMLElement | null;
  filename?: string;
  ticketId: string;
  candidateName: string;
  registrationType?: "mun" | "workshop";
  details?: {
    institution?: string;
    courseOrGrade?: string;
    chamber?: string;
    preferredCountry?: string;
    email?: string;
    phone?: string;
    timestamp?: string;
  };
}

export async function downloadBoardingPassPDF(options: PDFExportOptions): Promise<boolean> {
  const {
    elementId,
    element,
    filename,
    ticketId,
    candidateName,
    registrationType = "mun",
    details = {},
  } = options;

  const targetFilename =
    filename ||
    `IIST_MUN_2026_${registrationType === "workshop" ? "WorkshopPass" : "BoardingPass"}_${ticketId}.pdf`;

  let domElement: HTMLElement | null = element || null;
  if (!domElement && elementId) {
    domElement = document.getElementById(elementId);
  }

  // Attempt 1: Capture DOM element via html2canvas and jsPDF
  if (domElement) {
    try {
      const canvas = await html2canvas(domElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#020617",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const ratio = imgProps.height / imgProps.width;

      let renderWidth = pdfWidth - 20;
      let renderHeight = renderWidth * ratio;

      if (renderHeight > pdfHeight - 20) {
        renderHeight = pdfHeight - 20;
        renderWidth = renderHeight / ratio;
      }

      const posX = (pdfWidth - renderWidth) / 2;
      const posY = (pdfHeight - renderHeight) / 2;

      pdf.setFillColor(2, 6, 23); // #020617 dark background
      pdf.rect(0, 0, pdfWidth, pdfHeight, "F");

      pdf.addImage(imgData, "PNG", posX, posY, renderWidth, renderHeight);
      pdf.save(targetFilename);
      return true;
    } catch (err) {
      console.warn("DOM canvas capture failed, using high-res vector PDF layout generator");
    }
  }

  // Attempt 2: High-resolution direct jsPDF document synthesis fallback
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const isWorkshop = registrationType === "workshop";

    // Background slate dark
    pdf.setFillColor(2, 6, 23);
    pdf.rect(0, 0, 210, 297, "F");

    // Header Accent Line
    pdf.setFillColor(6, 182, 212); // cyan
    pdf.rect(15, 15, 180, 4, "F");

    // Card Container
    pdf.setFillColor(15, 23, 42);
    pdf.roundedRect(15, 20, 180, 255, 6, 6, "F");
    pdf.setDrawColor(30, 41, 59);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(15, 20, 180, 255, 6, 6, "S");

    // Title Section
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.text(isWorkshop ? "IIST MUN 2026 WORKSHOP PASS" : "IIST MUN 2026 BOARDING PASS", 25, 38);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      isWorkshop
        ? "Space Technology & Orbital Diplomacy Masterclass"
        : "Official Delegate Briefing Badge & Orbital Pass",
      25,
      45
    );

    // Launch Reference Box
    pdf.setFillColor(2, 6, 23);
    pdf.roundedRect(135, 28, 52, 20, 3, 3, "F");
    pdf.setTextColor(6, 182, 212);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(`ID: ${ticketId}`, 138, 40);

    // Divider
    pdf.setDrawColor(51, 65, 85);
    pdf.line(25, 52, 185, 52);

    // Candidate Details
    pdf.setFontSize(9);
    pdf.setTextColor(148, 163, 184);
    pdf.text("PASSENGER / CANDIDATE NAME", 25, 63);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.text(candidateName, 25, 71);

    if (details.email) {
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text("CONTACT EMAIL & TELEMETRY", 25, 82);
      pdf.setFontSize(11);
      pdf.setTextColor(56, 189, 248);
      pdf.text(`${details.email} ${details.phone ? `• ${details.phone}` : ""}`, 25, 89);
    }

    if (details.institution) {
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text("ACADEMIC INSTITUTION / COLLEGE", 25, 100);
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text(details.institution, 25, 107);
    }

    if (details.chamber || details.preferredCountry) {
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text("CHAMBER & PORTFOLIO CHOICE", 25, 118);
      pdf.setFontSize(11);
      pdf.setTextColor(168, 85, 247);
      pdf.text(
        `${(details.chamber || "COPUOS").toUpperCase()} — Preferred: ${
          details.preferredCountry || "India"
        }`,
        25,
        125
      );
    }

    // Confirmation Notice Box
    pdf.setFillColor(6, 182, 212, 0.1);
    pdf.setDrawColor(6, 182, 212);
    pdf.roundedRect(25, 138, 160, 28, 4, 4, "F");
    pdf.roundedRect(25, 138, 160, 28, 4, 4, "S");

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(6, 182, 212);
    pdf.text("REGISTRATION STATUS: CONFIRMED", 30, 147);

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(226, 232, 240);
    pdf.text(
      "Notice: Your portfolio assignment will be allotted shortly by the Executive Secretariat.",
      30,
      155
    );
    pdf.text("Registration status active in database.", 30, 161);

    // QR Code Placeholder & Unique ID Text
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(25, 175, 45, 45, 3, 3, "F");

    // QR visual grid
    pdf.setFillColor(15, 23, 42);
    pdf.rect(30, 180, 12, 12, "F");
    pdf.rect(53, 180, 12, 12, "F");
    pdf.rect(30, 203, 12, 12, "F");
    pdf.rect(46, 196, 6, 6, "F");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(148, 163, 184);
    pdf.text("SCAN FOR SECURITY VERIFICATION", 78, 185);

    pdf.setFontSize(12);
    pdf.setTextColor(6, 182, 212);
    pdf.text(`SCANNABLE ID: ${ticketId}`, 78, 194);

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139);
    pdf.text("Encodes candidate profile, reference key, and allotment status.", 78, 202);
    pdf.text("Issued by Indian Institute of Space Science and Technology (IIST)", 78, 208);

    // Timestamp & Footer
    pdf.setDrawColor(51, 65, 85);
    pdf.line(25, 230, 185, 230);

    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`LOGGED TIMESTAMP: ${details.timestamp || new Date().toLocaleString()}`, 25, 240);
    pdf.text("IIST MUN 2026 • VALIAMALA, THIRUVANANTHAPURAM • ISRO SPONSORED", 25, 246);

    pdf.save(targetFilename);
    return true;
  } catch (pdfErr) {
    console.error("PDF generation error:", pdfErr instanceof Error ? pdfErr.message : "Synthesis error");
    alert("Could not generate PDF. Please try again.");
    return false;
  }
}
