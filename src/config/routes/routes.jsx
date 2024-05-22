import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../../screens/home/home";
import Login from "../../screens/login/login";
import Forget from "../../screens/forget/forget";
import Transactions from "../../screens/alltranasctions/transactions";

const Routers = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Redirect from / to /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/ForgetPassword" element={<Forget />} />
          <Route path="/transactions" element={<Transactions />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};
export default Routers;
