"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AdminSectionNav,
  adminSectionIdFromHash,
  defaultAdminSectionId,
  type AdminSectionId,
} from "./admin-section-nav";

const AdminSectionContext = createContext<AdminSectionId>(defaultAdminSectionId);

function readActiveSectionFromLocation() {
  if (typeof window === "undefined") {
    return defaultAdminSectionId;
  }

  return adminSectionIdFromHash(window.location.hash) ?? defaultAdminSectionId;
}

export function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  const [activeSectionId, setActiveSectionId] = useState<AdminSectionId>(defaultAdminSectionId);

  useEffect(() => {
    const syncActiveSection = () => setActiveSectionId(readActiveSectionFromLocation());

    syncActiveSection();
    window.addEventListener("hashchange", syncActiveSection);
    window.addEventListener("popstate", syncActiveSection);

    return () => {
      window.removeEventListener("hashchange", syncActiveSection);
      window.removeEventListener("popstate", syncActiveSection);
    };
  }, []);

  const contextValue = useMemo(() => activeSectionId, [activeSectionId]);

  return (
    <AdminSectionContext.Provider value={contextValue}>
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <AdminSectionNav
          activeSectionId={activeSectionId}
          onSectionChange={(sectionId) => {
            setActiveSectionId(sectionId);

            if (typeof window !== "undefined" && window.location.hash !== `#${sectionId}`) {
              window.history.pushState(null, "", `#${sectionId}`);
            }
          }}
        />
        <div className="flex min-w-0 flex-col gap-5" data-testid="admin-section-content">
          {children}
        </div>
      </div>
    </AdminSectionContext.Provider>
  );
}

export function AdminSectionPanel({
  children,
  sectionId,
}: {
  children: React.ReactNode;
  sectionId: AdminSectionId;
}) {
  const activeSectionId = useContext(AdminSectionContext);

  if (activeSectionId !== sectionId) {
    return null;
  }

  return (
    <div data-section-id={sectionId} data-testid="admin-section-panel">
      {children}
    </div>
  );
}
