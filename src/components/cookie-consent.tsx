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
    <div className="bg-background/95 fixed inset-x-0 bottom-0 z-50 flex flex-col items-center justify-between gap-3 border-t px-4 py-3 backdrop-blur sm:flex-row">
      <p className="text-muted-foreground text-sm">{t.cookieBody}</p>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" onClick={handleReject}>
          {t.cookieReject}
        </Button>
        <Button size="sm" onClick={handleAccept}>
          {t.cookieAccept}
        </Button>
      </div>
    </div>
  );
}
