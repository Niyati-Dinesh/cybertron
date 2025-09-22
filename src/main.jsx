import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { ScanProvider } from "./context/ScanContext.jsx";
import { PortScanProvider } from "./context/PortScanContext.jsx";
//import { HygieneProvider } from "./context/HygieneContext.jsx";
//import { NetworkProvider } from "./context/NetworkContext.jsx";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ScanProvider>
        <PortScanProvider>
          {/*<HygieneProvider>
            <NetworkProvider>*/}
              <App />
            {/*</NetworkProvider>
          </HygieneProvider>*/}
        </PortScanProvider>
      </ScanProvider>
    </BrowserRouter>
  </StrictMode>
);
