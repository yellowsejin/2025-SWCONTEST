// src/components/ModalPortal.jsx
import { createPortal } from "react-dom";

export default function ModalPortal({ children }) {
  if (typeof document === "undefined") return null; // SSR 안전
  return createPortal(children, document.body);
}
