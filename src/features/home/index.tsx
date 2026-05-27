import React from "react";
import { useNavigate } from "react-router-dom";

const LIST_PREFIX = [
  {
    prefix: "vai",
    description: "Cây vải",
  },
  {
    prefix: "carton",
    description: "Thùng carton kho phụ liệu",
  },
  {
    prefix: "attachment",
    description: "Phụ liệu trong thùng",
  },
  {
    prefix: "bong",
    description: "Bông thành phẩm phụ trợ",
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">Q</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">
            QR-Gen Pro
          </span>
        </div>
        <div className="flex gap-4">
          <button className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
            Hướng dẫn
          </button>
          <button className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
            Liên hệ
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Tạo mã QR <span className="text-blue-600">Duy nhất</span> &{" "}
            <span className="text-blue-600">Hàng loạt</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Hệ thống tự động tạo chuỗi UUID không trùng lặp, tối ưu hóa cho máy
            in nhãn chuyên dụng. Quản lý kho bãi và tài sản chưa bao giờ đơn
            giản đến thế.
          </p>
          <div className={"flex flex-col"}>
            <button
              onClick={() => navigate("/warehouse-print")}
              className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-violet-200 transition-all active:scale-95 m-2"
            >
              Thẻ kho NPL
            </button>
            {LIST_PREFIX.map((item) => {
              return (
                <button
                  key={item.prefix}
                  onClick={() => navigate(`/generator?prefix=${item.prefix}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 m-2"
                >
                  {item.description}
                </button>
              );
            })}
          </div>
        </section>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-3">Độ bảo mật UUID</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Sử dụng thuật toán UUID v4 với xác suất trùng lặp gần như bằng
              không (1 trên hàng tỷ tỷ).
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-3">Tối ưu In ấn</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Kích thước chuẩn 105×22mm, 3 mã mỗi hàng. Tương thích hoàn hảo với
              các dòng máy in decal cuộn.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-xl mb-3">Tốc độ tức thì</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Render 600 mã QR trong chưa đầy 1 giây nhờ sức mạnh của React và
              thư viện Canvas tiên tiến.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <footer className="pt-8 border-t border-slate-200 text-center">
          <p className="text-slate-400 text-sm italic">
            Lưu ý: Luôn kiểm tra cài đặt "Margins: None" trước khi thực hiện
            lệnh in.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Home;
