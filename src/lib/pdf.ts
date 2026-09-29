import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportPlanToPDF(elementId: string, filename: string) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  });
  const img = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pageW) / canvas.width;

  let y = 0;
  let remaining = imgH;
  while (remaining > 0) {
    pdf.addImage(img, 'PNG', 0, y, pageW, imgH);
    remaining -= pageH;
    if (remaining > 0) {
      pdf.addPage();
      y -= pageH;
    }
  }
  pdf.save(filename);
}

export function getShareLinks(subject: string, url: string) {
  const text = encodeURIComponent(`${subject}\n${url}`);
  return {
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(subject)}`,
    whatsapp: `https://wa.me/?text=${text}`,
    email: `mailto:?subject=${encodeURIComponent(subject)}&body=${text}`,
  };
}