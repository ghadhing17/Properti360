import {
  Pool,
  Videocam,
  Security,
  GppGood,
  Yard,
  Deck,
  Roofing,
  Warehouse,
  Kitchen,
  Weekend,
  Restaurant,
  Desk,
  LocalLaundryService,
  AcUnit,
  Thermostat,
  Sensors,
  Wifi,
  ChildCare,
  Groups,
  DirectionsRun,
  Elevator,
  Foundation,
} from "@mui/icons-material";
import type { ReactNode } from "react";
import { fasilitasLabel, type FasilitasValue } from "@/shared/lib/validations/listing";

const fasilitasIcon: Record<FasilitasValue, ReactNode> = {
  KOLAM_RENANG: <Pool sx={{ fontSize: 16 }} />,
  CCTV: <Videocam sx={{ fontSize: 16 }} />,
  KEAMANAN_24JAM: <Security sx={{ fontSize: 16 }} />,
  ONE_GATE_SYSTEM: <GppGood sx={{ fontSize: 16 }} />,
  TAMAN: <Yard sx={{ fontSize: 16 }} />,
  BALKON: <Deck sx={{ fontSize: 16 }} />,
  ROOFTOP: <Roofing sx={{ fontSize: 16 }} />,
  GUDANG: <Warehouse sx={{ fontSize: 16 }} />,
  DAPUR: <Kitchen sx={{ fontSize: 16 }} />,
  RUANG_KELUARGA: <Weekend sx={{ fontSize: 16 }} />,
  RUANG_MAKAN: <Restaurant sx={{ fontSize: 16 }} />,
  RUANG_KERJA: <Desk sx={{ fontSize: 16 }} />,
  LAUNDRY_ROOM: <LocalLaundryService sx={{ fontSize: 16 }} />,
  AC: <AcUnit sx={{ fontSize: 16 }} />,
  WATER_HEATER: <Thermostat sx={{ fontSize: 16 }} />,
  SMART_HOME: <Sensors sx={{ fontSize: 16 }} />,
  INTERNET: <Wifi sx={{ fontSize: 16 }} />,
  PLAYGROUND: <ChildCare sx={{ fontSize: 16 }} />,
  CLUBHOUSE: <Groups sx={{ fontSize: 16 }} />,
  JOGGING_TRACK: <DirectionsRun sx={{ fontSize: 16 }} />,
  LIFT: <Elevator sx={{ fontSize: 16 }} />,
  BASEMENT: <Foundation sx={{ fontSize: 16 }} />,
};

export function FacilityPills({ fasilitas }: { fasilitas: readonly string[] }) {
  if (fasilitas.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5">
      {fasilitas.map((f) => {
        const value = f as FasilitasValue;
        return (
          <span
            key={f}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-foreground"
          >
            <span className="text-primary">{fasilitasIcon[value] ?? null}</span>
            {fasilitasLabel[value] ?? f}
          </span>
        );
      })}
    </div>
  );
}
