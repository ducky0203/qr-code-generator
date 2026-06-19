import React, { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllConfig,
  fetchViTriKho,
  fetchViTriThanhPham,
  type AllConfigData,
  type ViTriKho,
} from "./api";
import logoUrl from "../../assets/logo.png";

/** Loại vị trí cần in: NL/PL lấy theo id_Kho, TP lấy theo maChiNhanh. */
type LoaiViTri = "nl" | "pl" | "tp";

const LOAI_VI_TRI_OPTIONS: { value: LoaiViTri; label: string }[] = [
  { value: "nl", label: "Nguyên liệu" },
  { value: "pl", label: "Phụ liệu" },
  { value: "tp", label: "Thành phẩm" },
];

/** Tiền tố cố định cho QR vị trí kho. */
const VI_TRI_QR_PREFIX = "VT-";

/** Một thẻ chuẩn bị in. */
type PrintCard = {
  key: string;
  qrValue: string;
  /** Tên kho (NL/PL) hoặc tên chi nhánh (TP). */
  locationName: string;
  /** Mã vị trí kho. */
  maViTri: string;
};

/** Stack Roboto từ Google Fonts (đã load ở index.html), fallback hệ thống */
const ROBOTO_FONT_STACK =
  '"Roboto", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif';

/** Thiết kế thẻ cố định — khổ vuông 4×4 inch. */
const CARD = {
  size: 4,
  unit: "in" as const,
  logoHeightMm: 14,
  qrSize: 180,
  paddingMm: 6,
};

const PAGE_SIZE = `${CARD.size}${CARD.unit} ${CARD.size}${CARD.unit}`;

const WarehouseLocationPage: React.FC = () => {
  const navigate = useNavigate();

  // Chi nhánh đang chọn — chỉ dùng cho loại Thành phẩm (query theo maChiNhanh).
  const [maChiNhanh, setMaChiNhanh] = useState<string | null>(null);
  const [cards, setCards] = useState<PrintCard[]>([]);

  // ----- Tích hợp API cấu hình kho -----
  const [allConfig, setAllConfig] = useState<AllConfigData | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(false);

  const [loaiViTri, setLoaiViTri] = useState<LoaiViTri>("nl");
  const [selectedIdKho, setSelectedIdKho] = useState<number | null>(null);

  const [viTriList, setViTriList] = useState<ViTriKho[]>([]);
  const [viTriLoading, setViTriLoading] = useState(false);
  const [viTriError, setViTriError] = useState<string | null>(null);
  const [viTriFilter, setViTriFilter] = useState("");
  const [selectedViTriIds, setSelectedViTriIds] = useState<Set<number>>(
    () => new Set(),
  );

  useEffect(() => {
    let cancelled = false;
    setConfigLoading(true);
    setConfigError(null);
    fetchAllConfig()
      .then((data) => {
        if (!cancelled) setAllConfig(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setConfigError(
            err instanceof Error ? err.message : "Không tải được cấu hình",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setConfigLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Danh sách chi nhánh lấy từ all-config, sắp theo thứ tự stt. (Loại TP) */
  const branches = useMemo(() => {
    if (!allConfig) return [];
    return [...allConfig.listChiNhanh].sort((a, b) => a.stt - b.stt);
  }, [allConfig]);

  /** Tra cứu tên chi nhánh theo mã — để hiện kèm tên kho. */
  const branchNameByMa = useMemo(() => {
    const map = new Map<string, string>();
    allConfig?.listChiNhanh.forEach((c) => map.set(c.maChiNhanh, c.tenChiNhanh));
    return map;
  }, [allConfig]);

  /** Danh sách kho theo loại đang chọn (NL = loaiKho 1, PL = loaiKho 2). */
  const khoOptions = useMemo(() => {
    if (!allConfig || loaiViTri === "tp") return [];
    const loaiKho = loaiViTri === "nl" ? 1 : 2;
    return allConfig.listKho.filter((k) => k.loaiKho === loaiKho);
  }, [allConfig, loaiViTri]);

  // Đổi loại vị trí thì xoá toàn bộ lựa chọn & danh sách cũ.
  useEffect(() => {
    setSelectedIdKho(null);
    setMaChiNhanh(null);
    setViTriList([]);
    setSelectedViTriIds(new Set());
    setViTriFilter("");
    setViTriError(null);
  }, [loaiViTri]);

  /** Tải danh sách vị trí cho kho NL/PL hoặc chi nhánh thành phẩm. */
  const loadViTri = async (opts: {
    loai: LoaiViTri;
    idKho: number | null;
    ma: string | null;
  }) => {
    setViTriError(null);
    setViTriLoading(true);
    try {
      const list =
        opts.loai === "tp"
          ? opts.ma != null
            ? await fetchViTriThanhPham(opts.ma)
            : []
          : opts.idKho != null
            ? await fetchViTriKho(opts.idKho)
            : [];
      setViTriList(list);
      setViTriFilter("");
      // Mặc định chọn hết để in nhanh; người dùng có thể bỏ bớt.
      setSelectedViTriIds(new Set(list.map((v) => v.id_ViTriKho)));
    } catch (err: unknown) {
      setViTriList([]);
      setSelectedViTriIds(new Set());
      setViTriError(
        err instanceof Error ? err.message : "Không tải được vị trí",
      );
    } finally {
      setViTriLoading(false);
    }
  };

  // Chọn kho NL/PL → nạp vị trí theo id_Kho.
  const handleSelectKho = (id: number) => {
    setSelectedIdKho(id);
    setMaChiNhanh(null);
    void loadViTri({ loai: loaiViTri, idKho: id, ma: null });
  };

  // Chọn chi nhánh thành phẩm → nạp vị trí theo maChiNhanh.
  const handleSelectBranchTP = (ma: string) => {
    setMaChiNhanh(ma);
    setSelectedIdKho(null);
    void loadViTri({ loai: "tp", idKho: null, ma });
  };

  const toggleViTri = (id: number) => {
    setSelectedViTriIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Danh sách vị trí sau khi lọc theo mã / tên.
  const filteredViTri = useMemo(() => {
    const q = viTriFilter.trim().toLowerCase();
    if (!q) return viTriList;
    return viTriList.filter((v) =>
      `${v.ma_ViTriKho} ${v.ten_ViTriKho}`.toLowerCase().includes(q),
    );
  }, [viTriList, viTriFilter]);

  const allFilteredSelected =
    filteredViTri.length > 0 &&
    filteredViTri.every((v) => selectedViTriIds.has(v.id_ViTriKho));

  // Tích / bỏ tích tất cả các vị trí đang hiển thị (theo bộ lọc).
  const toggleSelectAllViTri = () => {
    setSelectedViTriIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredViTri.forEach((v) => next.delete(v.id_ViTriKho));
      } else {
        filteredViTri.forEach((v) => next.add(v.id_ViTriKho));
      }
      return next;
    });
  };

  const handleGenerateFromViTri = () => {
    const selected = viTriList.filter((v) =>
      selectedViTriIds.has(v.id_ViTriKho),
    );
    setCards(
      selected.map((v) => ({
        key: `vt-${v.id_ViTriKho}`,
        qrValue: `${VI_TRI_QR_PREFIX}${v.id_ViTriKho}`,
        locationName: loaiViTri === "tp" ? v.tenChiNhanh : v.ten_Kho,
        maViTri: v.ma_ViTriKho,
      })),
    );
  };

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
          <h1 className="text-xl font-bold text-gray-800">In QR vị trí kho</h1>
        </div>

        {cards.length > 0 && (
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold shadow-sm transition-all active:scale-95"
          >
            In ({cards.length} thẻ)
          </button>
        )}
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6 print:max-w-none print:m-0 print:p-0">
        <div className="grid lg:grid-cols-[minmax(440px,520px)_1fr] gap-6 items-start print:block">
          {/* Panel chọn vị trí */}
          <aside className="print:hidden bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-3 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-800">
                Nguồn vị trí
              </h2>
              {(configLoading || viTriLoading) && (
                <span className="text-xs text-gray-500">Đang tải…</span>
              )}
            </div>
            {configError && (
              <p className="text-xs text-red-600">
                Lỗi cấu hình: {configError}
              </p>
            )}

            {/* Loại vị trí */}
            <div className="grid grid-cols-3 gap-1.5">
              {LOAI_VI_TRI_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setLoaiViTri(o.value)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                    loaiViTri === o.value
                      ? "border-indigo-500 bg-indigo-600 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {loaiViTri !== "tp" ? (
              /* NL/PL: chọn kho trực tiếp */
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Kho ({khoOptions.length})
                </label>
                {khoOptions.length === 0 ? (
                  <p className="text-xs text-gray-500">— Không có kho —</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
                    {khoOptions.map((k) => (
                      <button
                        key={k.id_Kho}
                        type="button"
                        onClick={() => handleSelectKho(k.id_Kho)}
                        className={`block w-full text-left px-2.5 py-1.5 text-sm transition-colors ${
                          selectedIdKho === k.id_Kho
                            ? "bg-indigo-50 text-indigo-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {k.ten_Kho}
                        <span className="block text-[11px] text-gray-400">
                          {branchNameByMa.get(k.maChiNhanh) ?? k.maChiNhanh}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* TP: chọn chi nhánh từ danh sách */
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Chi nhánh
                </label>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
                  {branches.map((b) => (
                    <button
                      key={b.maChiNhanh}
                      type="button"
                      onClick={() => handleSelectBranchTP(b.maChiNhanh)}
                      className={`block w-full text-left px-2.5 py-1.5 text-sm transition-colors ${
                        maChiNhanh === b.maChiNhanh
                          ? "bg-indigo-50 text-indigo-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {b.tenChiNhanh}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {viTriError && <p className="text-xs text-red-600">{viTriError}</p>}

            {/* Danh sách vị trí kho: bảng lọc, tích chọn, in QR */}
            {viTriList.length > 0 && (
              <div className="flex-1 min-h-0 flex flex-col gap-2 pt-2 border-t border-gray-100">
                <input
                  type="text"
                  value={viTriFilter}
                  onChange={(e) => setViTriFilter(e.target.value)}
                  placeholder="Lọc theo mã / tên vị trí…"
                  className={`${panelInputClass} shrink-0`}
                />
                <div className="shrink-0 flex items-center justify-between text-xs text-gray-500">
                  <span>Vị trí ({filteredViTri.length})</span>
                  <span>
                    Đã chọn {selectedViTriIds.size}/{viTriList.length}
                  </span>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs text-gray-500">
                      <tr>
                        <th className="w-8 px-2 py-1.5">
                          <input
                            type="checkbox"
                            checked={allFilteredSelected}
                            disabled={filteredViTri.length === 0}
                            onChange={toggleSelectAllViTri}
                          />
                        </th>
                        <th className="px-2 py-1.5 font-medium">Mã vị trí</th>
                        <th className="px-2 py-1.5 font-medium">Tên</th>
                        <th className="px-2 py-1.5 font-medium whitespace-nowrap">
                          Dãy
                        </th>
                        <th className="px-2 py-1.5 font-medium whitespace-nowrap">
                          Ngăn
                        </th>
                        <th className="px-2 py-1.5 font-medium whitespace-nowrap">
                          QR
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredViTri.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-2 py-2 text-xs text-gray-500"
                          >
                            Không có vị trí khớp bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        filteredViTri.map((v) => {
                          const checked = selectedViTriIds.has(v.id_ViTriKho);
                          return (
                            <tr
                              key={v.id_ViTriKho}
                              onClick={() => toggleViTri(v.id_ViTriKho)}
                              className={`cursor-pointer ${
                                checked ? "bg-blue-50" : "hover:bg-gray-50"
                              }`}
                            >
                              <td className="px-2 py-1.5 align-top">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleViTri(v.id_ViTriKho)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td className="px-2 py-1.5 font-medium align-top">
                                {v.ma_ViTriKho}
                              </td>
                              <td className="px-2 py-1.5 text-gray-600 align-top">
                                {v.ten_ViTriKho}
                              </td>
                              <td className="px-2 py-1.5 text-gray-600 align-top whitespace-nowrap">
                                {v.day}
                              </td>
                              <td className="px-2 py-1.5 text-gray-600 align-top whitespace-nowrap">
                                {v.ngan}
                              </td>
                              <td className="px-2 py-1.5 text-[11px] text-gray-400 align-top whitespace-nowrap">
                                {VI_TRI_QR_PREFIX}
                                {v.id_ViTriKho}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateFromViTri}
                  disabled={selectedViTriIds.size === 0}
                  className="shrink-0 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-semibold shadow-sm transition-all active:scale-95"
                >
                  In QR ({selectedViTriIds.size})
                </button>
              </div>
            )}
          </aside>

          {cards.length > 0 && (
            <div className="flex flex-col items-center gap-6 print:gap-0 mx-auto print:mx-0">
              {cards.map((card) => (
                <WarehouseCard
                  key={card.key}
                  qrValue={card.qrValue}
                  locationName={card.locationName}
                  maViTri={card.maViTri}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @page {
          size: ${PAGE_SIZE};
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
  qrValue: string;
  locationName: string;
  maViTri: string;
};

const WarehouseCard: React.FC<WarehouseCardProps> = ({
  qrValue,
  locationName,
  maViTri,
}) => {
  const cardStyle = {
    width: `${CARD.size}${CARD.unit}`,
    height: `${CARD.size}${CARD.unit}`,
    padding: `${CARD.paddingMm}mm`,
    fontFamily: ROBOTO_FONT_STACK,
  };

  return (
    <article
      className="bg-white flex flex-col items-center justify-between text-center box-border print:break-after-page print:page-break-after-always shadow-md print:shadow-none"
      style={cardStyle}
    >
      <header className="shrink-0 flex flex-col items-center">
        <img
          src={logoUrl}
          alt="Logo công ty"
          className="w-auto object-contain"
          style={{ height: `${CARD.logoHeightMm}mm` }}
        />
        <p className="leading-snug mt-1 text-base font-medium">
          {locationName}
        </p>
      </header>

      <QRCodeCanvas
        value={qrValue}
        size={CARD.qrSize}
        level="M"
        marginSize={0}
      />

      <p className="shrink-0 font-bold uppercase tracking-wider break-all text-3xl">
        {maViTri}
      </p>
    </article>
  );
};

export default WarehouseLocationPage;
