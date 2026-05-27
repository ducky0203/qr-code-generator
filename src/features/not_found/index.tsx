import { useNavigate } from "react-router-dom";
import React from "react";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div
      className={
        "flex flex-1 justify-center items-center h-screen bg-linear-to-r from-gray-100 to-gray-300"
      }
    >
      <div className="flex h-full flex-1 items-center justify-center font-sans">
        <div className="w-full max-w-md transform rounded-xl bg-white p-8 text-center shadow-2xl transition-all duration-300">
          <div className="mb-4 text-9xl leading-none font-black tracking-tight text-red-600 opacity-90 md:text-[10rem]">
            404
          </div>
          <h1 className="mb-3 text-3xl font-extrabold text-gray-900 md:text-4xl">
            Trang không tìm thấy
          </h1>
          <p className="mx-auto mb-8 max-w-xs text-base text-gray-600">
            Rất tiếc, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm.
          </p>
          <button
            type="button"
            className="flex w-full transform items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700"
            onClick={handleGoHome}
            aria-label="Quay lại Trang chủ"
          >
            <i className="pi pi-home mr-3 text-lg"></i>
            Quay lại Trang chủ
          </button>

          <div className="mt-8 text-xs text-gray-400">
            Mã lỗi: RESOURCE_NOT_FOUND
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
