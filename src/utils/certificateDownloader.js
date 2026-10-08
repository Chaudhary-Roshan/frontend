import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Exports a certificate DOM element into a crisp, landscape A4 PDF document.
 * @param {string} elementId - ID of the container element to capture.
 * @param {string} filename - Target filename for the saved PDF.
 */
export const downloadCertificatePDF = async (elementId, filename = 'Certificate.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Certificate element #${elementId} not found.`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 3, // High-DPI 300+ DPI equivalent for razor-sharp text and graphics
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (err) {
    console.error('Error generating certificate PDF:', err);
    throw err;
  }
};

/**
 * Exports a certificate DOM element into a high-resolution PNG image.
 * @param {string} elementId - ID of the container element to capture.
 * @param {string} filename - Target filename for the saved PNG.
 */
export const downloadCertificatePNG = async (elementId, filename = 'Certificate.png') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Certificate element #${elementId} not found.`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
    });

    const link = document.createElement('a');
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    return true;
  } catch (err) {
    console.error('Error exporting certificate PNG:', err);
    throw err;
  }
};
