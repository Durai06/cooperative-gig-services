import { Alert as NativeAlert, Platform, type AlertButton } from "react-native";
/** Keep native dialogs on phones; RN Web does not implement Alert.alert. */
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS !== "web")
      return NativeAlert.alert(title, message, buttons);
    if (typeof window === "undefined") return;
    const action = buttons?.find((b) => b.style !== "cancel");
    const cancel = buttons?.find((b) => b.style === "cancel");
    if (cancel && action) {
      if (window.confirm(`${title}\n\n${message ?? ""}`)) action.onPress?.();
    } else {
      window.alert(`${title}\n\n${message ?? ""}`);
      action?.onPress?.();
    }
  },
};
