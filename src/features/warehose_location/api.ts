/** Lớp gọi API cấu hình kho cho màn hình in thẻ kho. */

const API_BASE = "http://14.225.7.203:5070/api";

/** loaiKho: 1 = Nguyên liệu (NL), 2 = Phụ liệu (PL). */
export type LoaiKho = 1 | 2;

export type Kho = {
  id_Kho: number;
  loaiKho: number;
  ten_Kho: string;
  maChiNhanh: string;
};

export type ChiNhanhConfig = {
  maChiNhanh: string;
  tenChiNhanh: string;
  chiNhanh_PhuTro: boolean;
  stt: number;
};

export type AllConfigData = {
  listKho: Kho[];
  listChiNhanh: ChiNhanhConfig[];
};

export type ViTriKho = {
  id_ViTriKho: number;
  nhomKho: number;
  id_Kho: number;
  ten_Kho: string;
  maChiNhanh: string;
  tenChiNhanh: string;
  ma_ViTriKho: string;
  ten_ViTriKho: string;
  day: string;
  ngan: string;
  max_CBM: number;
  ghiChu: string;
  stt_ViTriKho: number;
  tonTai: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  code: number;
  message: string;
  data: T;
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Lỗi mạng (HTTP ${res.status})`);
  }
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!body.success) {
    throw new Error(body.message || "API trả về lỗi");
  }
  return body.data;
}

/** Danh sách mã chi nhánh và danh sách kho. */
export function fetchAllConfig(): Promise<AllConfigData> {
  return getJson<AllConfigData>(`${API_BASE}/config/all-config`);
}

/** Vị trí kho Nguyên liệu / Phụ liệu — lấy theo id_Kho. */
export async function fetchViTriKho(idKho: number): Promise<ViTriKho[]> {
  const data = await getJson<{ listViTriKho: ViTriKho[] }>(
    `${API_BASE}/config/vi-tri-kho?id_Kho=${encodeURIComponent(idKho)}`,
  );
  return data.listViTriKho ?? [];
}

/** Vị trí kho Thành phẩm — lấy theo maChiNhanh. */
export async function fetchViTriThanhPham(
  maChiNhanh: string,
): Promise<ViTriKho[]> {
  const data = await getJson<{ listViTriKho: ViTriKho[] }>(
    `${API_BASE}/config/vi-tri-thanh-pham?maChiNhanh=${encodeURIComponent(maChiNhanh)}`,
  );
  return data.listViTriKho ?? [];
}
