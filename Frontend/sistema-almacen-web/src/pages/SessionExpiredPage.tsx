import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function SessionExpiredPage() {
  const navigate = useNavigate();

  const [segundos, setSegundos] =
    useState(8);

  useEffect(() => {
    // Garantiza que el token inválido quede eliminado.
    localStorage.removeItem("swa_token");

    const intervalo = window.setInterval(() => {
      setSegundos((valorActual) => {
        if (valorActual <= 1) {
          window.clearInterval(intervalo);

          navigate("/login", {
            replace: true,
          });

          return 0;
        }

        return valorActual - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [navigate]);

  const volverAlInicio = () => {
    navigate("/login", {
      replace: true,
    });
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        boxSizing: "border-box",
        background:
          "linear-gradient(145deg, #173b7a 0%, #102957 100%)",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "500px",
          padding: "42px",
          boxSizing: "border-box",
          borderRadius: "20px",
          background: "#ffffff",
          boxShadow:
            "0 25px 60px rgba(3, 18, 48, 0.35)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "68px",
            height: "68px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 22px",
            borderRadius: "50%",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: "32px",
            fontWeight: "800",
          }}
        >
          !
        </div>

        <h1
          style={{
            margin: "0 0 14px",
            color: "#102957",
            fontSize: "29px",
          }}
        >
          La sesión terminó
        </h1>

        <p
          style={{
            margin: "0 0 12px",
            color: "#64748b",
            fontSize: "16px",
            lineHeight: 1.6,
          }}
        >
          La sesión expiró o las
          credenciales dejaron de ser
          válidas.
        </p>

        <p
          style={{
            margin: "0 0 26px",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Regresarás al inicio de sesión
          en{" "}
          <strong>{segundos}</strong>{" "}
          segundos.
        </p>

        <button
          type="button"
          onClick={volverAlInicio}
          style={{
            width: "100%",
            minHeight: "49px",
            border: "none",
            borderRadius: "10px",
            background: "#1c4e9c",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Volver al inicio
        </button>
      </section>
    </main>
  );
}