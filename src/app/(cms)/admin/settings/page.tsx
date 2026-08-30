import { requireRole } from "@/shared/auth/session";
import {
  getSiteSettings,
  getOperatingHours,
  getHolidays,
  getAdminProfile,
  getAllUsersForAdmin,
  getActiveRegions,
  getAllRegionsForAdmin,
} from "@/modules/cms";
import { SettingsTabs } from "@/modules/cms/components/settings/settings-tabs";
import { GeneralSettingsForm } from "@/modules/cms/components/settings/general-form";
import { SeoSettingsForm } from "@/modules/cms/components/settings/seo-form";
import { OperatingHoursForm } from "@/modules/cms/components/settings/operating-hours-form";
import { HolidaysManager } from "@/modules/cms/components/settings/holidays-manager";
import { ProfileForm } from "@/modules/cms/components/settings/profile-form";
import { UsersManager } from "@/modules/cms/components/settings/users-manager";
import { RegionsManager } from "@/modules/cms/components/settings/regions-manager";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import PersonIcon from "@mui/icons-material/Person";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import MapIcon from "@mui/icons-material/Map";

export const dynamic = "force-dynamic";

const TABS = [
  { value: "umum", label: "Umum", icon: <StorefrontIcon sx={{ fontSize: 18 }} /> },
  { value: "seo", label: "SEO & OG", icon: <ManageSearchIcon sx={{ fontSize: 18 }} /> },
  { value: "jam-operasional", label: "Jam Operasional", icon: <AccessTimeIcon sx={{ fontSize: 18 }} /> },
  { value: "hari-libur", label: "Hari Libur", icon: <EventBusyIcon sx={{ fontSize: 18 }} /> },
  { value: "wilayah", label: "Wilayah", icon: <MapIcon sx={{ fontSize: 18 }} /> },
  { value: "profil", label: "Profil Admin", icon: <PersonIcon sx={{ fontSize: 18 }} /> },
  { value: "pengguna", label: "Pengguna", icon: <ManageAccountsIcon sx={{ fontSize: 18 }} /> },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const VALID_TABS = TABS.map((t) => t.value) as readonly string[];

function nullToEmpty(v: string | null | undefined): string {
  return v ?? "";
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireRole("ADMIN");
  const { tab } = await searchParams;
  const active: TabValue = (VALID_TABS.includes(tab ?? "") ? tab : "umum") as TabValue;

  // Query hanya data tab aktif
  let content: React.ReactNode = null;
  if (active === "umum") {
    const s = await getSiteSettings();
    content = (
      <GeneralSettingsForm
        values={{
          siteName: s.siteName,
          tagline: nullToEmpty(s.tagline),
          description: nullToEmpty(s.description),
          contactEmail: nullToEmpty(s.contactEmail),
          contactPhone: nullToEmpty(s.contactPhone),
          whatsapp: nullToEmpty(s.whatsapp),
          address: nullToEmpty(s.address),
          instagramUrl: nullToEmpty(s.instagramUrl),
          facebookUrl: nullToEmpty(s.facebookUrl),
        }}
      />
    );
  } else if (active === "seo") {
    const s = await getSiteSettings();
    content = (
      <SeoSettingsForm
        values={{
          metaTitle: nullToEmpty(s.metaTitle),
          metaDescription: nullToEmpty(s.metaDescription),
          ogTitle: nullToEmpty(s.ogTitle),
          ogDescription: nullToEmpty(s.ogDescription),
          ogImage: nullToEmpty(s.ogImage),
        }}
      />
    );
  } else if (active === "jam-operasional") {
    const days = await getOperatingHours();
    content = <OperatingHoursForm days={days} />;
  } else if (active === "hari-libur") {
    const holidays = await getHolidays();
    content = (
      <HolidaysManager
        holidays={holidays.map((h) => ({ id: h.id, date: h.date, name: h.name, isRecurring: h.isRecurring }))}
      />
    );
  } else if (active === "wilayah") {
    const [activeRegions, allRegions] = await Promise.all([getActiveRegions(), getAllRegionsForAdmin()]);
    const activeProvinces = activeRegions.filter((r) => r.level === "PROVINCE").map((r) => r.code);
    const activeRegencies = activeRegions.filter((r) => r.level === "REGENCY").map((r) => r.code);
    content = (
      <RegionsManager
        provinces={allRegions.provinces}
        regencies={allRegions.regencies}
        initialProvinces={activeProvinces}
        initialRegencies={activeRegencies}
      />
    );
  } else if (active === "profil") {
    const profile = await getAdminProfile(user.id);
    content = (
      <ProfileForm
        values={{
          name: profile?.name ?? user.name ?? "",
          email: profile?.email ?? user.email,
          phone: profile?.phone ?? "",
          joinedAt: (profile?.createdAt ?? new Date()).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
        }}
      />
    );
  } else if (active === "pengguna") {
    const users = await getAllUsersForAdmin();
    content = <UsersManager users={users} currentUserId={user.id} />;
  }

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#0F172A" }}>
          Settings
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748B", mt: 0.25 }}>
          Kelola profil bisnis, SEO &amp; OG, jam operasional, hari libur, cakupan wilayah, dan pengguna.
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", overflow: "hidden", px: 1, pt: 0.5 }}>
        <SettingsTabs tabs={[...TABS]} active={active} />
      </Paper>

      {/* Content */}
      <Box>{content}</Box>
    </Stack>
  );
}
