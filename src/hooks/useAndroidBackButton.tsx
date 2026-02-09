import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";

const ROOT_PATHS = ["/", "/dashboard"];

export function useAndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPress = useRef<number>(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handler = App.addListener("backButton", ({ canGoBack }) => {
      const isRoot = ROOT_PATHS.includes(location.pathname);

      if (!isRoot && canGoBack) {
        navigate(-1);
      } else {
        const now = Date.now();
        if (now - lastBackPress.current < 2000) {
          App.exitApp();
        } else {
          lastBackPress.current = now;
          toast("Press back again to exit", { duration: 2000 });
        }
      }
    });

    return () => {
      handler.then((h) => h.remove());
    };
  }, [navigate, location.pathname]);
}
