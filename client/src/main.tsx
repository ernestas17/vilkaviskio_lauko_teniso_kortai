import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import ReservationActionPage from "./pages/ReservationActionPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminPage from "./pages/AdminPage";
import "./index.css";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/confirm/:token", element: <ReservationActionPage mode="confirm" /> },
  { path: "/cancel/:token", element: <ReservationActionPage mode="cancel" /> },
  { path: "/admin/login", element: <AdminLoginPage /> },
  { path: "/admin", element: <AdminPage /> },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
