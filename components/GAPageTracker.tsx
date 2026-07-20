"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { gtagPageView } from "@/lib/gtag";

export default function GAPageTracker({ id }: { id: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    if (!id || !pathname) return;
    const path = query ? `${pathname}?${query}` : pathname;
    gtagPageView(id, path);
  }, [id, pathname, query]);

  return null;
}
