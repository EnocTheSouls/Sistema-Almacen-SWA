import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { currentUser } from "../auth/userSession";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({
  children,
}: LayoutProps) {
  return (
    <div
      style={{
        display: "flex",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <header
          style={{
            height: "70px",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            padding: "0 30px",
            borderBottom:
              "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#102957",
            }}
          >
            Sistema Almacén
          </div>

          <div
            style={{
              fontWeight: "600",
              color: "#102957",
            }}
          >
            {currentUser?.role}
          </div>
        </header>

        <main
          style={{
            flex: 1,
            padding: "30px",
            background: "#f1f5f9",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}