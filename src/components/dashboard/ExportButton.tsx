"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const PDF_MARGIN_PT = 40;
const PDF_EDGE_BUFFER_PT = 10;

function prepareExportClone(element: HTMLElement) {
  element.style.overflow = "visible";
  element.style.boxSizing = "border-box";
  element.querySelectorAll<HTMLElement>("[data-export-overflow]").forEach((node) => {
    node.style.overflow = "visible";
  });
}

export function ExportButton({ className = "" }: { className?: string }) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    const element = document.getElementById("executive-summary-export");
    if (!element || exporting) return;

    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf")
      ]);

      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight,
        onclone: (_, cloned) => {
          prepareExportClone(cloned as HTMLElement);
        }
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const horizontalInset = PDF_MARGIN_PT + PDF_EDGE_BUFFER_PT;
      const printableWidth = pageWidth - horizontalInset * 2;
      const printableHeight = pageHeight - PDF_MARGIN_PT * 2;
      const imgHeight = (canvas.height * printableWidth) / canvas.width;

      const imgData = canvas.toDataURL("image/png", 1.0);
      let heightLeft = imgHeight;
      let offsetY = 0;

      while (heightLeft > 0) {
        if (offsetY > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "PNG", horizontalInset, PDF_MARGIN_PT - offsetY, printableWidth, imgHeight);
        heightLeft -= printableHeight;
        offsetY += printableHeight;
      }

      pdf.save("workforce-pulse-executive-summary.pdf");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button onClick={handleExport} disabled={exporting} variant="outline" className={className}>
      <Download size={16} aria-hidden />
      <span className="hidden sm:inline">{exporting ? "Generating PDF…" : "Download Executive Summary"}</span>
      <span className="sm:hidden">{exporting ? "Exporting…" : "Export PDF"}</span>
    </Button>
  );
}
