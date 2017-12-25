import InitScreen from "./init-screen";
import BootScreen from "./boot-screen";
import ROMInputDialog from "./rom-input";
import {
  showUIAlertModal,
  closeUIAlertModal,
  showUILoadingModal,
  closeUILoadingModal,
  isUILoadingModalActive,
  setUILoadingModalTitle,
  setUILoadingModalTitleColor,
  setUILoadingModalTitleBottom
} from "./loading-modal";

export const showBootScreen = BootScreen;
export const showInitScreen = InitScreen;
export const showAlertModal = showUIAlertModal;
export const closeAlertModal = closeUIAlertModal;
export const showLoadingModal = showUILoadingModal;
export const closeLoadingModal = closeUILoadingModal;
export const isLoadingModalActive = isUILoadingModalActive;
export const setLoadingModalTitle = setUILoadingModalTitle;
export const setLoadingModalBottom = setUILoadingModalTitleBottom;
export const setLoadingModalTitleColor = setUILoadingModalTitleColor;
export const showROMInputDialog = ROMInputDialog;
