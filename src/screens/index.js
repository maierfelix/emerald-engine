import InitScreen from "./init-screen";
import ROMInputDialog from "./rom-input";
import {
  showUILoadingModal,
  closeUILoadingModal,
  setUILoadingModalTitle,
  setUILoadingModalTitleColor,
  setUILoadingModalTitleBottom
} from "./loading-modal";

export const showInitScreen = InitScreen;
export const showLoadingModal = showUILoadingModal;
export const closeLoadingModal = closeUILoadingModal;
export const setLoadingModalTitle = setUILoadingModalTitle;
export const setLoadingModalBottom = setUILoadingModalTitleBottom;
export const setLoadingModalTitleColor = setUILoadingModalTitleColor;
export const showROMInputDialog = ROMInputDialog;
