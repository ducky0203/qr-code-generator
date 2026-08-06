import React, { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import chiNhanhList from "../../data/ListChiNhanh.json";

type SizeUnit = "mm" | "in";
type QrPosition = "right" | "left";

type ChiNhanh = {
  MaChiNhanh: string;
  TenChiNhanh: string;
  TenDayDu: string;
};

type CardDesign = {
  width: number;
  height: number;
  unit: SizeUnit;
  companyName: string;
  cardTitle: string;
  fieldLabels: string[];
  qrSize: number;
  autoQrSize: boolean;
  qrPosition: QrPosition;
  fontScale: number;
  fieldLineHeight: number;
  fieldGap: number;
  screenScale: number;
  paddingMm: number;
  showBorder: boolean;
};

const QR_PREFIX_OPTIONS = [
  { name: "Không chọn", prefix: "" },
  { name: "Carton kho phụ liệu", prefix: "carton-" },
] as const;
type QrPrefix = (typeof QR_PREFIX_OPTIONS)[number]["prefix"];

const DEFAULT_FIELD_LABELS: string[] = [];
const LEGACY_FIELD_LABEL_KEYS = [] as const;

/** Key lưu vào localStorage. Đổi suffix khi thay đổi shape không tương thích. */
const STORAGE_KEY = "warehouse-print-config-v1";
const AUTOSAVE_KEY = "warehouse-print-autosave-v1";

type PersistedConfig = {
  design: CardDesign;
  maChiNhanh: string;
  qrPrefix: QrPrefix;
  quantity: number;
};

function normalizeQrPrefix(value: unknown): QrPrefix {
  const matchedOption = QR_PREFIX_OPTIONS.find(
    (option) => option.prefix === value,
  );
  return matchedOption?.prefix ?? "";
}

function normalizeFieldLabels(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((label): label is string => typeof label === "string");
  }

  if (value && typeof value === "object") {
    const legacyLabels = LEGACY_FIELD_LABEL_KEYS.map(
      (key) => (value as Record<string, unknown>)[key],
    ).filter((label): label is string => typeof label === "string");

    if (legacyLabels.length > 0) return legacyLabels;
  }

  return [...DEFAULT_FIELD_LABELS];
}

function safeReadLocalStorage(key: string): string | null {
  try {
    return typeof window !== "undefined"
      ? window.localStorage.getItem(key)
      : null;
  } catch {
    return null;
  }
}

function safeWriteLocalStorage(key: string, value: string) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  } catch {
    /* quota / privacy mode — bỏ qua */
  }
}

function safeRemoveLocalStorage(key: string) {
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function loadStoredConfig(): PersistedConfig | null {
  const raw = safeReadLocalStorage(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedConfig> | null;
    if (!parsed || typeof parsed !== "object") return null;
    const design = parsed.design as
      | (Partial<Omit<CardDesign, "fieldLabels">> & { fieldLabels?: unknown })
      | undefined;
    if (!design || typeof design !== "object") return null;
    return {
      design: {
        ...DEFAULT_DESIGN,
        ...design,
        fieldLabels: normalizeFieldLabels(design.fieldLabels),
      },
      maChiNhanh:
        typeof parsed.maChiNhanh === "string" ? parsed.maChiNhanh : "13",
      qrPrefix: normalizeQrPrefix(parsed.qrPrefix),
      quantity:
        typeof parsed.quantity === "number" && parsed.quantity > 0
          ? parsed.quantity
          : 10,
    };
  } catch {
    return null;
  }
}

function loadAutoSaveFlag(): boolean {
  return safeReadLocalStorage(AUTOSAVE_KEY) === "1";
}

/** Stack Roboto từ Google Fonts (đã load ở index.html), fallback hệ thống */
const ROBOTO_FONT_STACK =
  '"Roboto", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif';

/** Khớp mẫu qrcode_print.pdf (ngang 6×4 inch) */
const DEFAULT_DESIGN: CardDesign = {
  width: 6,
  height: 4,
  unit: "in",
  companyName: "CÔNG TY CỔ PHẦN ĐẦU TƯ VÀ THƯƠNG MẠI TNG",
  cardTitle: "THẺ KHO",
  fieldLabels: [...DEFAULT_FIELD_LABELS],
  qrSize: 120,
  autoQrSize: false,
  qrPosition: "left",
  fontScale: 1,
  fieldLineHeight: 24,
  fieldGap: 10,
  screenScale: 1,
  paddingMm: 6,
  showBorder: false,
};

function toCssSize(value: number, unit: SizeUnit) {
  return `${value}${unit}`;
}

function estimateQrSize(width: number, height: number, unit: SizeUnit) {
  const w = unit === "in" ? width * 96 : width * 3.78;
  const h = unit === "in" ? height * 96 : height * 3.78;
  return Math.round(Math.min(w * 0.3, h * 0.42, 200));
}

function scaleFont(base: number, fontScale: number) {
  return Math.round(base * fontScale);
}

const WarehousePrintPage: React.FC = () => {
  const navigate = useNavigate();
  const branches = chiNhanhList as ChiNhanh[];

  const [autoSave, setAutoSave] = useState<boolean>(() => loadAutoSaveFlag());
  const [design, setDesign] = useState<CardDesign>(() => {
    if (!loadAutoSaveFlag()) return DEFAULT_DESIGN;
    return loadStoredConfig()?.design ?? DEFAULT_DESIGN;
  });
  const [maChiNhanh, setMaChiNhanh] = useState(() => {
    if (!loadAutoSaveFlag()) return "13";
    return loadStoredConfig()?.maChiNhanh ?? "13";
  });
  const [qrPrefix, setQrPrefix] = useState<QrPrefix>(() => {
    if (!loadAutoSaveFlag()) return "";
    return loadStoredConfig()?.qrPrefix ?? "";
  });
  const [quantity, setQuantity] = useState(() => {
    if (!loadAutoSaveFlag()) return 10;
    return loadStoredConfig()?.quantity ?? 10;
  });
  const [cardIds, setCardIds] = useState<string[]>([]);

  useEffect(() => {
    safeWriteLocalStorage(AUTOSAVE_KEY, autoSave ? "1" : "0");
  }, [autoSave]);

  useEffect(() => {
    if (!autoSave) return;
    const payload: PersistedConfig = { design, maChiNhanh, qrPrefix, quantity };
    safeWriteLocalStorage(STORAGE_KEY, JSON.stringify(payload));
  }, [autoSave, design, maChiNhanh, qrPrefix, quantity]);

  const handleToggleAutoSave = (next: boolean) => {
    setAutoSave(next);
    if (!next) {
      safeRemoveLocalStorage(STORAGE_KEY);
    }
  };

  const handleClearSaved = () => {
    safeRemoveLocalStorage(STORAGE_KEY);
    setDesign(DEFAULT_DESIGN);
    setMaChiNhanh("13");
    setQrPrefix("");
    setQuantity(10);
  };

  const selectedBranch =
    branches.find((b) => b.MaChiNhanh === maChiNhanh) ?? branches[0];

  const resolvedDesign = useMemo(() => {
    const qrSize = design.autoQrSize
      ? estimateQrSize(design.width, design.height, design.unit)
      : design.qrSize;
    return { ...design, qrSize };
  }, [design]);

  const pageSize = `${toCssSize(resolvedDesign.width, resolvedDesign.unit)} ${toCssSize(resolvedDesign.height, resolvedDesign.unit)}`;

  const updateDesign = <K extends keyof CardDesign>(
    key: K,
    value: CardDesign[K],
  ) => {
    setDesign((prev) => ({ ...prev, [key]: value }));
  };

  const updateFieldLabel = (index: number, value: string) => {
    setDesign((prev) => ({
      ...prev,
      fieldLabels: prev.fieldLabels.map((label, currentIndex) =>
        currentIndex === index ? value : label,
      ),
    }));
  };

  const addFieldLabel = () => {
    setDesign((prev) => ({
      ...prev,
      fieldLabels: [...prev.fieldLabels, "Nhãn mới:"],
    }));
  };

  const removeFieldLabel = (index: number) => {
    setDesign((prev) => ({
      ...prev,
      fieldLabels: prev.fieldLabels.filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    }));
  };

  const resetDesign = () => setDesign(DEFAULT_DESIGN);

  const handleGenerate = () => {
    const count = Math.min(Math.max(quantity, 1), 600);
    const timestamp = Date.now();
    setCardIds(
      Array.from({ length: count }, (_, index) => `${timestamp}${index + 1}`),
    );
  };

  const sizeLabel = `${resolvedDesign.width}${resolvedDesign.unit === "in" ? "″" : "mm"} × ${resolvedDesign.height}${resolvedDesign.unit === "in" ? "″" : "mm"}`;

  const panelInputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="print:hidden sticky top-0 z-50 bg-white shadow-md p-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            ← Quay lại
          </button>
          <h1 className="text-xl font-bold text-gray-800">Form in thẻ kho</h1>
          <span className="text-sm text-gray-500 hidden sm:block">
            {sizeLabel}
          </span>
        </div>

        {cardIds.length > 0 && (
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition-all active:scale-95"
          >
            In ({cardIds.length} thẻ)
          </button>
        )}
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6 print:max-w-none print:m-0 print:p-0">
        <div className="grid lg:grid-cols-[minmax(320px,380px)_1fr] gap-6 items-start print:block">
          {/* Panel điều chỉnh */}
          <aside className="print:hidden bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-5 lg:sticky lg:top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-800">
                Panel điều chỉnh
              </h2>
              <button
                type="button"
                onClick={resetDesign}
                className="text-xs text-gray-500 hover:text-blue-600 whitespace-nowrap"
              >
                Mặc định
              </button>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Khổ giấy</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Rộng
                  </label>
                  <input
                    type="number"
                    min={10}
                    step={0.1}
                    value={design.width}
                    onChange={(e) =>
                      updateDesign("width", Number(e.target.value))
                    }
                    className={panelInputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Cao
                  </label>
                  <input
                    type="number"
                    min={10}
                    step={0.1}
                    value={design.height}
                    onChange={(e) =>
                      updateDesign("height", Number(e.target.value))
                    }
                    className={panelInputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Đơn vị
                  </label>
                  <select
                    value={design.unit}
                    onChange={(e) =>
                      updateDesign("unit", e.target.value as SizeUnit)
                    }
                    className={panelInputClass}
                  >
                    <option value="in">inch</option>
                    <option value="mm">mm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Lề thẻ (mm)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={design.paddingMm}
                    onChange={(e) =>
                      updateDesign("paddingMm", Number(e.target.value))
                    }
                    className={panelInputClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Chi nhánh
              </p>
              <select
                value={maChiNhanh}
                onChange={(e) => setMaChiNhanh(e.target.value)}
                className={panelInputClass}
              >
                {branches.map((b) => (
                  <option key={b.MaChiNhanh} value={b.MaChiNhanh}>
                    {b.TenDayDu}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Tiền tố QR code
              </p>
              <select
                value={qrPrefix}
                onChange={(e) => setQrPrefix(normalizeQrPrefix(e.target.value))}
                className={panelInputClass}
              >
                {QR_PREFIX_OPTIONS.map((option) => (
                  <option key={option.name} value={option.prefix}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Tiêu đề</p>
              <input
                type="text"
                value={design.companyName}
                onChange={(e) => updateDesign("companyName", e.target.value)}
                placeholder="Tên công ty"
                className={panelInputClass}
              />
              <input
                type="text"
                value={design.cardTitle}
                onChange={(e) => updateDesign("cardTitle", e.target.value)}
                placeholder="Tiêu đề thẻ"
                className={panelInputClass}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-700">
                  Nhãn trường (viết tay)
                </p>
                <button
                  type="button"
                  onClick={addFieldLabel}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Thêm nhãn
                </button>
              </div>
              {design.fieldLabels.length === 0 && (
                <p className="text-xs text-gray-500">
                  Chưa có nhãn nào. Bấm “Thêm nhãn” để thêm dòng viết tay.
                </p>
              )}
              {design.fieldLabels.map((label, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => updateFieldLabel(index, e.target.value)}
                    className={panelInputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeFieldLabel(index)}
                    className="shrink-0 px-2.5 py-2 text-xs text-gray-500 hover:text-red-600 border border-gray-300 rounded-lg"
                  >
                    Xoá
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">QR & chữ</p>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={design.autoQrSize}
                  onChange={(e) => updateDesign("autoQrSize", e.target.checked)}
                />
                QR tự co theo thẻ
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={design.showBorder}
                  onChange={(e) => updateDesign("showBorder", e.target.checked)}
                />
                Hiện viền thẻ
              </label>
              <input
                type="number"
                min={24}
                max={200}
                disabled={design.autoQrSize}
                value={design.qrSize}
                onChange={(e) => updateDesign("qrSize", Number(e.target.value))}
                className={`${panelInputClass} disabled:bg-gray-100`}
              />
              {design.autoQrSize && (
                <p className="text-xs text-gray-500">
                  ≈ {resolvedDesign.qrSize}px
                </p>
              )}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Vị trí QR
                </label>
                <select
                  value={design.qrPosition}
                  onChange={(e) =>
                    updateDesign("qrPosition", e.target.value as QrPosition)
                  }
                  className={panelInputClass}
                >
                  <option value="left">Bên trái</option>
                  <option value="right">Bên phải</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Cỡ chữ ({Math.round(design.fontScale * 100)}%)
                </label>
                <input
                  type="range"
                  min={0.7}
                  max={1.4}
                  step={0.05}
                  value={design.fontScale}
                  onChange={(e) =>
                    updateDesign("fontScale", Number(e.target.value))
                  }
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Cao dòng
                  </label>
                  <input
                    type="number"
                    min={16}
                    max={60}
                    value={design.fieldLineHeight}
                    onChange={(e) =>
                      updateDesign("fieldLineHeight", Number(e.target.value))
                    }
                    className={panelInputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Khoảng cách
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={40}
                    value={design.fieldGap}
                    onChange={(e) =>
                      updateDesign("fieldGap", Number(e.target.value))
                    }
                    className={panelInputClass}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              <p className="text-sm font-medium text-gray-700">Lưu cài đặt</p>
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={autoSave}
                  onChange={(e) => handleToggleAutoSave(e.target.checked)}
                />
                <span>
                  Tự động lưu cài đặt vào trình duyệt
                  <span className="block text-xs text-gray-500">
                    Lưu khổ giấy, tiêu đề, QR, tiền tố, chi nhánh, số lượng… cho
                    lần mở sau (localStorage).
                  </span>
                </span>
              </label>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span
                  className={
                    autoSave ? "text-green-600 font-medium" : "text-gray-500"
                  }
                >
                  {autoSave ? "● Đang lưu tự động" : "○ Không lưu"}
                </span>
                <button
                  type="button"
                  onClick={handleClearSaved}
                  className="text-gray-500 hover:text-red-600 underline-offset-2 hover:underline"
                >
                  Xóa cài đặt đã lưu
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng thẻ
                </label>
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className={panelInputClass}
                />
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold shadow-sm transition-all active:scale-95"
              >
                Tạo thẻ & QR
              </button>
            </div>
          </aside>

          {cardIds.length > 0 && (
            <div
              className="flex flex-col items-center gap-6 print:gap-0 wh-print-screen-scale mx-auto print:mx-0"
              style={
                {
                  ["--screen-scale" as string]: resolvedDesign.screenScale,
                } as React.CSSProperties
              }
            >
              {cardIds.map((id) => (
                <WarehouseCard
                  key={id}
                  id={id}
                  branchName={selectedBranch.TenDayDu}
                  qrPrefix={qrPrefix}
                  design={resolvedDesign}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media screen {
          .wh-print-screen-scale {
            transform: scale(var(--screen-scale, 1));
            transform-origin: top center;
          }
        }
        @page {
          size: ${pageSize};
          margin: 0;
        }
        @media print {
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
          }
        }
      `,
        }}
      />
    </div>
  );
};

type WarehouseCardProps = {
  id: string;
  branchName: string;
  qrPrefix: QrPrefix;
  design: CardDesign & { qrSize: number };
};

const WarehouseCard: React.FC<WarehouseCardProps> = ({
  id,
  branchName,
  qrPrefix,
  design,
}) => {
  const qrValue = `${qrPrefix}${id}`;
  const cardStyle = {
    width: toCssSize(design.width, design.unit),
    height: toCssSize(design.height, design.unit),
    padding: `${design.paddingMm}mm`,
    fontFamily: ROBOTO_FONT_STACK,
  };

  return (
    <article
      className={`relative bg-white flex flex-col box-border print:break-after-page print:page-break-after-always shadow-md print:shadow-none ${design.showBorder ? "border border-black" : ""}`}
      style={cardStyle}
    >
      <header className="text-center shrink-0">
        <p
          className="font-bold leading-snug uppercase tracking-wide"
          style={{ fontSize: scaleFont(16, design.fontScale) }}
        >
          {design.companyName}
        </p>
        <p
          className="leading-snug mt-0.5"
          style={{ fontSize: scaleFont(13, design.fontScale) }}
        >
          {branchName}
        </p>
      </header>

      <div className="relative my-2" style={{ height: design.qrSize }}>
        <div
          className={`absolute top-0 ${design.qrPosition === "right" ? "right-0" : "left-0"}`}
        >
          <QRCodeCanvas
            value={qrValue}
            size={design.qrSize}
            level="M"
            marginSize={0}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p
            className="font-bold uppercase tracking-wider text-center"
            style={{ fontSize: scaleFont(28, design.fontScale) }}
          >
            {design.cardTitle}
          </p>
        </div>
      </div>

      <div className="flex flex-col mt-auto" style={{ gap: design.fieldGap }}>
        {design.fieldLabels.map((label, index) => (
          <FieldRow
            key={`${index}-${label}`}
            label={label}
            fontScale={design.fontScale}
            lineHeight={design.fieldLineHeight}
          />
        ))}
      </div>
      <div
        className="absolute align-text-top text-gray-800 whitespace-pre-wrap break-all"
        style={{
          right: `${design.paddingMm}mm`,
          bottom: "1mm",
          fontSize: scaleFont(12, design.fontScale),
          lineHeight: 1.1,
        }}
      >
        {qrValue}
      </div>
    </article>
  );
};

const FieldRow: React.FC<{
  label: string;
  fontScale: number;
  lineHeight: number;
}> = ({ label, fontScale, lineHeight }) => (
  <div
    className="flex items-baseline gap-1"
    style={{ fontSize: scaleFont(14, fontScale), minHeight: lineHeight }}
  >
    <p className="shrink-0 font-bold whitespace-pre">{label}</p>
    <span className="flex-1 border-b border-dotted border-black self-baseline" />
  </div>
);

export default WarehousePrintPage;
