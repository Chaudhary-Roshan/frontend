import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Exports any structured HTML document container into a multi-page A4 Portrait PDF
 * with intelligent page splitting and automatic empty page elimination.
 *
 * @param {string} elementId - DOM ID of the element to capture
 * @param {string} filename - Output PDF filename
 * @param {object} options - Optional configuration
 */
export const exportMultiPagePDF = async (elementId, filename = 'Document.pdf', options = {}) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Document element #${elementId} not found.`);
    throw new Error(`Element #${elementId} not found`);
  }

  // Preserve original inline styles during capture
  const originalWidth = element.style.width;
  const originalMaxWidth = element.style.maxWidth;

  try {
    // Standardize capture width for consistent high-res rendering
    element.style.width = '800px';
    element.style.maxWidth = '800px';

    const canvas = await html2canvas(element, {
      scale: 2, // 2x DPI for crisp text
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1200,
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfPageWidth = 210; // A4 portrait width in mm
    const pdfPageHeight = 297; // A4 portrait height in mm
    const marginMm = options.marginMm ?? 8;
    const contentWidthMm = pdfPageWidth - (marginMm * 2);
    const contentHeightMm = pdfPageHeight - (marginMm * 2);

    // Canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Height of one A4 content page in canvas pixels
    const pageCanvasHeight = Math.floor((canvasWidth * contentHeightMm) / contentWidthMm);

    let renderedHeight = 0;
    let pageIndex = 0;

    while (renderedHeight < canvasHeight) {
      const remainingHeight = canvasHeight - renderedHeight;
      // Skip tiny slivers (less than 30px) that produce accidental blank pages
      if (remainingHeight < 35 && pageIndex > 0) {
        break;
      }

      const chunkHeight = Math.min(pageCanvasHeight, remainingHeight);

      // Create a canvas slice for this page
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasWidth;
      pageCanvas.height = chunkHeight;
      const ctx = pageCanvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, chunkHeight);
      ctx.drawImage(
        canvas,
        0, renderedHeight, canvasWidth, chunkHeight,
        0, 0, canvasWidth, chunkHeight
      );

      // Check if this chunk is completely blank white (all pixels 255)
      const imgDataObj = ctx.getImageData(0, 0, Math.min(canvasWidth, 200), Math.min(chunkHeight, 200));
      let isBlank = true;
      for (let i = 0; i < imgDataObj.data.length; i += 4) {
        // Look for any non-white pixel
        if (imgDataObj.data[i] < 245 || imgDataObj.data[i + 1] < 245 || imgDataObj.data[i + 2] < 245) {
          isBlank = false;
          break;
        }
      }

      // If page is not page 0 and is completely blank, don't append a blank page
      if (isBlank && pageIndex > 0 && remainingHeight < pageCanvasHeight) {
        break;
      }

      if (pageIndex > 0) {
        pdf.addPage();
      }

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
      const renderHeightMm = (chunkHeight * contentWidthMm) / canvasWidth;

      pdf.addImage(pageImgData, 'JPEG', marginMm, marginMm, contentWidthMm, renderHeightMm);

      renderedHeight += chunkHeight;
      pageIndex++;
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (err) {
    console.error('Error generating document PDF:', err);
    throw err;
  } finally {
    // Restore original element styles
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
  }
};
