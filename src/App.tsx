import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./features/home";
import QRGenerator from "./features/generator";
import WarehousePrintPage from "./features/warehouse_print";
import WarehouseLocationPage from "./features/warehose_location";
import NotFoundPage from "./features/not_found";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/generator" element={<QRGenerator />} />
        <Route path="/warehouse-print" element={<WarehousePrintPage />} />
        <Route path="/warehouse-location" element={<WarehouseLocationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
