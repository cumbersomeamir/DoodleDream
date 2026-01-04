
import { jsPDF } from 'jspdf';

export const generatePDF = async (title: string, childName: string, images: string[]) => {
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // COVER PAGE
  pdf.setFillColor(240, 240, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setTextColor(63, 81, 181);
  pdf.setFontSize(40);
  pdf.text(childName + "'s", pageWidth / 2, 80, { align: 'center' });
  
  pdf.setFontSize(50);
  pdf.setFont('helvetica', 'bold');
  pdf.text("AWESOME", pageWidth / 2, 105, { align: 'center' });
  pdf.text("COLORING BOOK", pageWidth / 2, 130, { align: 'center' });

  pdf.setFontSize(30);
  pdf.setFont('helvetica', 'normal');
  pdf.text(title.toUpperCase(), pageWidth / 2, 180, { align: 'center' });

  // Add a nice border on cover
  pdf.setLineWidth(5);
  pdf.setDrawColor(63, 81, 181);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // CONTENT PAGES
  for (let i = 0; i < images.length; i++) {
    pdf.addPage();
    const imgData = images[i];
    
    // Calculate dimensions to fit image nicely on A4
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2);
    
    // Standard aspect ratio from generator is 3:4
    // Width / Height = 0.75
    let imgWidth = maxWidth;
    let imgHeight = maxWidth / 0.75;

    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = maxHeight * 0.75;
    }

    const xPos = (pageWidth - imgWidth) / 2;
    const yPos = (pageHeight - imgHeight) / 2;

    pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
    
    // Add page number
    pdf.setFontSize(10);
    pdf.text(`Page ${i + 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  pdf.save(`${childName}_Coloring_Book.pdf`);
};
