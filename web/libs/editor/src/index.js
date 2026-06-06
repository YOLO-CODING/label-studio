// Suppress mobx-state-tree "no longer part of a state tree" warnings in development
import { setLivelinessChecking } from "mobx-state-tree";
setLivelinessChecking("ignore");

// Suppress known third-party library warnings
const _origWarn = console.warn;
const _origError = console.error;
const SUPPRESSED_WARNINGS = [
  "A props object containing a \"key\" prop is being spread into JSX",
  "Support for defaultProps will be removed from memo components",
  "Attempted to synchronously unmount a root while React was already rendering",
];
console.warn = (...args) => {
  const msg = args[0];
  if (typeof msg === "string" && SUPPRESSED_WARNINGS.some((s) => msg.includes(s))) return;
  _origWarn.apply(console, args);
};
console.error = (...args) => {
  const msg = args[0];
  if (typeof msg === "string" && SUPPRESSED_WARNINGS.some((s) => msg.includes(s))) return;
  _origError.apply(console, args);
};

import "./core/feature-flags";
import "./assets/styles/global.scss";
import { LabelStudio } from "./LabelStudio";

window.LabelStudio = LabelStudio;

export default LabelStudio;

export { LabelStudio };
