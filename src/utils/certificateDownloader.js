import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Exports a certificate DOM element into a crisp, landscape A4 PDF document
 * fitted precisely on a single page with ZERO extra or blank pages.
 * @param {string} elementId - ID of the container element to capture.
 * @param {string} filename - Target filename for the saved PDF.
 */
export const downloadCertificatePDF = async (elementId, filename = 'Certificate.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Certificate element #${elementId} not found.`);
    return false;
  }

  let dataUrl = null;
  try {
    // Primary: html-to-image with cache busting
    dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2.5,
      cacheBust: true,
      style: {
        transform: 'none',
        margin: '0',
      }
    });
  } catch (err1) {
    console.warn('html-to-image failed, falling back to html2canvas:', err1);
    try {
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false, // Never taint canvas so toDataURL succeeds
      });
      dataUrl = canvas.toDataURL('image/jpeg', 0.98);
    } catch (err2) {
      console.error('html2canvas fallback failed:', err2);
      throw err2;
    }
  }

  if (!dataUrl) throw new Error('Could not capture certificate');

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();   // 297mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm
  const imgProps = pdf.getImageProperties(dataUrl);

  // Maintain aspect ratio while ensuring the image NEVER overflows the page boundary
  let renderWidth = pageWidth;
  let renderHeight = (imgProps.height * renderWidth) / imgProps.width;

  if (renderHeight > pageHeight) {
    renderHeight = pageHeight;
    renderWidth = (imgProps.width * renderHeight) / imgProps.height;
  }

  const xOffset = Math.max(0, (pageWidth - renderWidth) / 2);
  const yOffset = Math.max(0, (pageHeight - renderHeight) / 2);

  // Exact 1-page fit
  pdf.addImage(dataUrl, 'PNG', xOffset, yOffset, renderWidth, renderHeight);
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  return true;
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
    return false;
  }

  let dataUrl = null;
  try {
    dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2.5,
      cacheBust: true,
      style: {
        transform: 'none',
        margin: '0',
      }
    });
  } catch (err1) {
    console.warn('html-to-image failed, falling back to html2canvas:', err1);
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: false,
    });
    dataUrl = canvas.toDataURL('image/png');
  }

  if (!dataUrl) throw new Error('Could not capture certificate image');

  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = dataUrl;
  link.click();
  return true;
};
