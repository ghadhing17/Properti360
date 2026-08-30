"use client";

import { useRouter } from "next/navigation";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

export type SettingsTabItem = {
  value: string;
  label: string;
  icon: React.ReactElement;
};

type Props = {
  tabs: SettingsTabItem[];
  active: string;
};

/** Tab navigasi /admin/settings — sinkron dengan ?tab= search param (server-rendered content). */
export function SettingsTabs({ tabs, active }: Props) {
  const router = useRouter();

  return (
    <Tabs
      value={active}
      onChange={(_e, value: string) => {
        if (value && value !== active) {
          router.push(`/admin/settings?tab=${value}`, { scroll: false });
        }
      }}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      sx={{
        minHeight: 44,
        borderBottom: "1px solid #E2E8F0",
        "& .MuiTab-root": {
          minHeight: 44,
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.82rem",
          color: "#64748B",
        },
        "& .MuiTab-root.Mui-selected": { color: "#1D4ED8" },
        "& .MuiTabs-indicator": { backgroundColor: "#1D4ED8", height: 2 },
      }}
    >
      {tabs.map((t) => (
        <Tab key={t.value} value={t.value} icon={t.icon} iconPosition="start" label={t.label} disableRipple />
      ))}
    </Tabs>
  );
}
