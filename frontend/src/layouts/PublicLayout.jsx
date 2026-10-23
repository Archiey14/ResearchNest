import { Outlet } from "react-router-dom";
import BrandHeader from "../components/BrandHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

export default function PublicLayout() {
  return (
    <div className="public-shell">
      <BrandHeader />
      <main className="public-main">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
