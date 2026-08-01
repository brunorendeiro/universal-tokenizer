"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getStoredConsent, setConsent, loadAnalytics } from "@/lib/analytics";
import { ui, type Locale } from "@/lib/i18n";

export function CookieConsent({ locale }: { locale: Locale }) {
  const t = ui[locale];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Deferred to an effect for the same reason as useLocale: consent is
    // read from localStorage, unavailable during SSR — checking it during
    // render would cause a hydration mismatch.
    const stored = getStoredConsent();
    if (stored === "granted") {
      loadAnalytics();
    } else if (stored === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function handleAccept() {
    setConsent("granted");
    loadAnalytics();
    setVisible(false);
  }

  function handleReject() {
    setConsent("denied");
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-5 z-50 mx-auto flex w-[760px] items-center justify-between gap-5 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <p className="text-xs leading-5 text-slate-600">{t.cookieBody}</p>
      <div className="flex shrink-0 gap-2">
        <Button variant="ghost" size="sm" onClick={handleReject} className="text-slate-500 hover:text-slate-950">
          {t.cookieReject}
        </Button>
        <Button size="sm" onClick={handleAccept} className="bg-slate-950 text-white hover:bg-slate-800">
          {t.cookieAccept}
        </Button>
      </div>
    </div>
  );
}
