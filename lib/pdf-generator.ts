// Simple PDF generation utility
export function generatePDF(content: string, title: string): Blob {
  // Create a simple PDF structure
  const pdfContent = [
    "%PDF-1.4",
    "1 0 obj",
    "<<",
    "/Type /Catalog",
    "/Pages 2 0 R",
    ">>",
    "endobj",
    "2 0 obj",
    "<<",
    "/Type /Pages",
    "/Kids [3 0 R]",
    "/Count 1",
    ">>",
    "endobj",
    "3 0 obj",
    "<<",
    "/Type /Page",
    "/Parent 2 0 R",
    "/Resources <<",
    "/Font <<",
    "/F1 4 0 R",
    ">>",
    ">>",
    "/MediaBox [0 0 612 792]",
    "/Contents 5 0 R",
    ">>",
    "endobj",
    "4 0 obj",
    "<<",
    "/Type /Font",
    "/Subtype /Type1",
    "/BaseFont /Helvetica",
    ">>",
    "endobj",
    "5 0 obj",
    "<<",
    "/Length " + (content.length + 100),
    ">>",
    "stream",
    "BT",
    "/F1 12 Tf",
    "50 750 Td",
    "(" + escapeStringForPDF(title) + ") Tj",
    "0 -20 Td",
  ];

  // Split content into lines and add to PDF
  const lines = content.split('\n');
  lines.forEach(line => {
    pdfContent.push("(" + escapeStringForPDF(line.substring(0, 80)) + ") Tj");
    pdfContent.push("0 -15 Td");
  });

  pdfContent.push(
    "ET",
    "endstream",
    "endobj",
    "xref",
    "0 6",
    "0000000000 65535 f",
    "0000000009 00000 n",
    "0000000058 00000 n",
    "0000000115 00000 n",
    "0000000260 00000 n",
    "0000000342 00000 n",
    "trailer",
    "<<",
    "/Size 6",
    "/Root 1 0 R",
    ">>",
    "startxref",
    "500",
    "%%EOF"
  );

  const pdfString = pdfContent.join('\n');
  return new Blob([pdfString], { type: 'application/pdf' });
}

function escapeStringForPDF(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\x00-\x1F\x7F-\xFF]/g, '');
}

// Generate DOCX format (simplified)
export function generateDOCX(content: string, title: string): Blob {
  const docxContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        h1 { color: #333; }
        p { margin: 10px 0; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${content.split('\n').map(line => `<p>${line}</p>`).join('')}
    </body>
    </html>
  `;
  
  return new Blob([docxContent], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });
}
