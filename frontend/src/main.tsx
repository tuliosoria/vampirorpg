import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ApiProvider } from "./api/ApiProvider";
import { CanonProvider } from "./api/CanonProvider";
import { apiClient } from "./api";
import { AppRoutes } from "./App";
import { theme } from "./theme";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ApiProvider client={apiClient}>
        <CanonProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </CanonProvider>
      </ApiProvider>
    </ThemeProvider>
  </StrictMode>,
);
