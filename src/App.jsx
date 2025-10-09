import React from "react";
import GalaxyBg from "./components/GalaxyBg";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <>
      <div><Toaster/></div>
      <GalaxyBg></GalaxyBg>
    </>
  );
}
