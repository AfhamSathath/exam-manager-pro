import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Download } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PaperViewerProps {
  pdfUrl: string; // e.g., "http://localhost:5001/uploads/papers/filename.pdf"
}

const PaperViewer: React.FC<PaperViewerProps> = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState<number | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="space-y-4">
      {/* Download Button */}
      <div className="flex justify-end mb-2">
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:opacity-90 transition"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </a>
      </div>

      {/* PDF Preview */}
      <div className="overflow-auto border rounded p-2">
        <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
          {Array.from(new Array(numPages), (_, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={800} // adjust width for responsiveness if needed
            />
          ))}
        </Document>
      </div>
    </div>
  );
};

export default PaperViewer;
