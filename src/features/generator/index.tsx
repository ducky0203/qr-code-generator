import React, { useMemo } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate, useSearchParams } from "react-router-dom";

const TOTAL_CODES = 600;
const CODES_PER_ROW = 3;
const LABEL_WIDTH = "105mm";
const LABEL_HEIGHT = "22mm";
const QR_SIZE = 68;
const SCREEN_SCALE = 1.33;

const generateUniqueCodes = (count: number): string[] => {
  const timestamp = Date.now();
  return Array.from({ length: count }, (_, index) => `${timestamp}${index + 1}`);
};

const QRGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefix = searchParams.get("prefix") || null;

  const qrData = useMemo(() => generateUniqueCodes(TOTAL_CODES), []);

  const rows = useMemo(() => {
    const grouped: string[][] = [];
    for (let i = 0; i < qrData.length; i += CODES_PER_ROW) {
      grouped.push(qrData.slice(i, i + CODES_PER_ROW));
    }
    return grouped;
  }, [qrData]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="print:hidden sticky top-0 z-50 bg-white shadow-md p-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            ← Quay lại
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            Bộ tạo 600 QR Code
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-500">105mm × 22mm</span>
          <button
            onClick={() => window.print()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition-all active:scale-95"
          >
            In nhãn (Print)
          </button>
        </div>
      </header>

      <main className="flex flex-col items-center p-8 print:p-0">
        <div
          className="print:block origin-top qr-screen-scale"
          style={
            {
              ["--screen-scale" as string]: SCREEN_SCALE,
            } as React.CSSProperties
          }
        >
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="flex bg-white overflow-hidden print:break-after-page print:page-break-after-always border-b border-dashed border-gray-200 print:border-none shadow-sm print:shadow-none"
              style={{ width: LABEL_WIDTH, height: LABEL_HEIGHT }}
            >
              {row.map((id) => (
                <div
                  key={id}
                  className="flex-1 flex flex-col items-center justify-center p-1 min-w-0"
                >
                  <QRCodeCanvas
                    value={prefix ? `${prefix}-${id}` : id}
                    size={QR_SIZE}
                    level="M"
                    marginSize={0}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media screen {
          .qr-screen-scale {
            transform: scale(var(--screen-scale, 1));
            transform-origin: top center;
          }
        }
        @page { 
          size: ${LABEL_WIDTH} ${LABEL_HEIGHT}; 
          margin: 0; 
        }
        @media print {
          body { 
            margin: 0; 
            -webkit-print-color-adjust: exact; 
          }
          .print\\:break-after-page { 
            break-after: page; 
          }
        }
      `,
        }}
      />
    </div>
  );
};

export default QRGenerator;
