"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useCallback,
  useTransition,
} from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MuiSelect from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PersonIcon from "@mui/icons-material/Person";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { createBookingRequest } from "@/modules/landing/actions/booking";
import { TIME_SLOTS } from "@/shared/lib/booking-schedule";
import type { ProductForBooking } from "@/shared/lib/validations/product";
import { formatPrice } from "@/shared/lib/validations/product";
import { AddressFields, type AddressValue } from "@/modules/landing/components/address-fields";

// -- Constants -----------------------------------------------------------------

const initialState = {
  success: false,
  error: undefined as string | undefined,
  fieldErrors: undefined as Record<string, string[]> | undefined,
};

const PROPERTY_TYPES = [
  { value: "RUMAH", label: "Rumah" },
  { value: "APARTEMEN", label: "Apartemen" },
  { value: "HOTEL", label: "Hotel" },
  { value: "RUKO", label: "Ruko" },
  { value: "VENUE", label: "Venue" },
  { value: "LAINNYA", label: "Lainnya" },
];

const HARI_PENDEK = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

type SlotStatus = "available" | "blocked" | "loading";

type Props = {
  products?: ProductForBooking[];
  initialProductId?: string;
  compact?: boolean;
  scheduleNote?: string;
};

// -- Helpers -------------------------------------------------------------------

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// -- Step Indicator ------------------------------------------------------------

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
      {/* Step 1 */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.78rem",
            fontWeight: 700,
            flexShrink: 0,
            ...(step === 1
              ? {
                  background: "linear-gradient(135deg, #1D4ED8 0%, #60A5FA 100%)",
                  color: "#fff",
                  boxShadow: "0 2px 8px rgba(29,78,216,0.35)",
                }
              : { bgcolor: "success.main", color: "#fff" }),
          }}
        >
          {step > 1 ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : "1"}
        </Box>
        <Typography
          sx={{
            fontSize: "0.8rem",
            fontWeight: step === 1 ? 700 : 500,
            color: step === 1 ? "primary.main" : "text.secondary",
          }}
        >
          Jadwal & Paket
        </Typography>
      </Box>

      {/* Connector */}
      <Box
        sx={{
          flex: 1,
          height: 2,
          bgcolor: step === 2 ? "primary.main" : "divider",
          borderRadius: 1,
          mx: 0.5,
        }}
      />

      {/* Step 2 */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.78rem",
            fontWeight: 700,
            flexShrink: 0,
            ...(step === 2
              ? {
                  background: "linear-gradient(135deg, #1D4ED8 0%, #60A5FA 100%)",
                  color: "#fff",
                  boxShadow: "0 2px 8px rgba(29,78,216,0.35)",
                }
              : {
                  bgcolor: "action.disabledBackground",
                  color: "text.disabled",
                  border: "1.5px solid",
                  borderColor: "divider",
                }),
          }}
        >
          2
        </Box>
        <Typography
          sx={{
            fontSize: "0.8rem",
            fontWeight: step === 2 ? 700 : 400,
            color: step === 2 ? "primary.main" : "text.disabled",
          }}
        >
          Data Diri
        </Typography>
      </Box>
    </Box>
  );
}

// -- Calendar Component --------------------------------------------------------

interface CalendarProps {
  selectedDate: string | null;
  onSelect: (date: string) => void;
  fullyBookedDates: Set<string>;
  closedDates: Set<string>;
  loadingMonth: boolean;
}

function BookingCalendar({ selectedDate, onSelect, fullyBookedDates, closedDates, loadingMonth }: CalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 3);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Box>
      {/* Month nav */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Button
          size="small"
          onClick={prevMonth}
          disabled={!canGoPrev}
          sx={{ minWidth: 36, p: 0.5, borderRadius: 1 }}
        >
          <ChevronLeftIcon />
        </Button>
        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "text.primary" }}>
          {BULAN_ID[viewMonth]} {viewYear}
        </Typography>
        <Button size="small" onClick={nextMonth} sx={{ minWidth: 36, p: 0.5, borderRadius: 1 }}>
          <ChevronRightIcon />
        </Button>
      </Box>

      {/* Day headers */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: 1 }}>
        {HARI_PENDEK.map((d) => (
          <Typography
            key={d}
            align="center"
            sx={{ fontSize: "0.72rem", fontWeight: 600, color: "text.secondary", py: 0.5 }}
          >
            {d}
          </Typography>
        ))}
      </Box>

      {/* Date grid */}
      {loadingMonth ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={34} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
          {cells.map((day, idx) => {
            if (day === null) return <Box key={`empty-${idx}`} />;

            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const cellDate = new Date(viewYear, viewMonth, day);
            const isPast = cellDate < today;
            const isSunday = cellDate.getDay() === 0;
            const isBeyondMax = cellDate > maxDate;
            const isFullyBooked = fullyBookedDates.has(dateStr);
            const isClosedDay = isSunday || closedDates.has(dateStr);
            const isDisabled = isPast || isClosedDay || isBeyondMax || isFullyBooked;
            const isSelected = selectedDate === dateStr;
            const isToday = toDateString(today) === dateStr;

            const tooltipTitle = isClosedDay
              ? "Hari tutup / libur"
              : isFullyBooked
              ? "Penuh — semua slot terisi"
              : isPast
              ? "Tanggal sudah lewat"
              : isBeyondMax
              ? "Maks booking 3 bulan ke depan"
              : "";

            return (
              <Tooltip key={dateStr} title={tooltipTitle} placement="top" arrow>
                <span style={{ display: "block" }}>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => !isDisabled && onSelect(dateStr)}
                    disabled={isDisabled}
                    sx={{
                      width: "100%",
                      aspectRatio: "1",
                      border: "none",
                      borderRadius: 1,
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      fontWeight: isSelected ? 700 : isToday ? 600 : 400,
                      fontSize: "0.82rem",
                      transition: "all 0.15s",
                      position: "relative",
                      ...(isSelected
                        ? {
                            background: "linear-gradient(135deg, #1D4ED8 0%, #60A5FA 100%)",
                            color: "#fff",
                            boxShadow: "0 2px 8px rgba(29,78,216,0.35)",
                          }
                        : isDisabled
                        ? {
                            bgcolor: isFullyBooked || isClosedDay ? "rgba(0,0,0,0.04)" : "transparent",
                            color: "text.disabled",
                            textDecoration: isFullyBooked ? "line-through" : "none",
                          }
                        : {
                            bgcolor: isToday ? "rgba(29,78,216,0.08)" : "transparent",
                            color: "text.primary",
                            "&:hover": { bgcolor: "rgba(29,78,216,0.12)", color: "primary.main" },
                          }),
                    }}
                  >
                    {day}
                    {isFullyBooked && !isSelected && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 2,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          bgcolor: "error.light",
                        }}
                      />
                    )}
                  </Box>
                </span>
              </Tooltip>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

// -- Time Slot Grid ------------------------------------------------------------

interface TimeSlotsProps {
  selectedTime: string | null;
  onSelect: (time: string) => void;
  slotStatuses: Record<string, SlotStatus>;
}

function TimeSlotGrid({ selectedTime, onSelect, slotStatuses }: TimeSlotsProps) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>
      {TIME_SLOTS.map((slot) => {
        const status = slotStatuses[slot.value] ?? "available";
        const isBlocked = status === "blocked";
        const isLoading = status === "loading";
        const isSelected = selectedTime === slot.value;

        return (
          <Tooltip key={slot.value} title={isBlocked ? "Slot sudah terisi" : ""} placement="top" arrow>
            <span style={{ display: "block" }}>
              <Box
                component="button"
                type="button"
                onClick={() => !isBlocked && !isLoading && onSelect(slot.value)}
                disabled={isBlocked || isLoading}
                sx={{
                  width: "100%",
                  py: 1,
                  px: 0.5,
                  border: "1.5px solid",
                  borderRadius: 1,
                  cursor: isBlocked || isLoading ? "not-allowed" : "pointer",
                  fontSize: "0.8rem",
                  fontWeight: isSelected ? 700 : 500,
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                  ...(isSelected
                    ? {
                        background: "linear-gradient(135deg, #1D4ED8 0%, #60A5FA 100%)",
                        borderColor: "#1D4ED8",
                        color: "#fff",
                        boxShadow: "0 2px 8px rgba(29,78,216,0.3)",
                      }
                    : isBlocked
                    ? {
                        borderColor: "divider",
                        bgcolor: "action.disabledBackground",
                        color: "text.disabled",
                        textDecoration: "line-through",
                      }
                    : isLoading
                    ? { borderColor: "divider", bgcolor: "transparent", color: "text.disabled" }
                    : {
                        borderColor: "divider",
                        bgcolor: "transparent",
                        color: "text.primary",
                        "&:hover": {
                          borderColor: "primary.main",
                          bgcolor: "rgba(29,78,216,0.06)",
                          color: "primary.main",
                        },
                      }),
                }}
              >
                {isLoading ? (
                  <CircularProgress size={12} thickness={5} />
                ) : isBlocked ? (
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "error.light", flexShrink: 0 }} />
                ) : null}
                {slot.label}
              </Box>
            </span>
          </Tooltip>
        );
      })}
    </Box>
  );
}

// -- Main Form -----------------------------------------------------------------

export function BookingForm({ products = [], initialProductId, compact = false, scheduleNote }: Props) {
  const [state, formAction, pending] = useActionState(createBookingRequest, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const cardRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const timeSlotRef = useRef<HTMLDivElement>(null);
  const [highlightCalendar, setHighlightCalendar] = useState(false);
  const [highlightTimeSlot, setHighlightTimeSlot] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId ?? "");
  const [slotStatuses, setSlotStatuses] = useState<Record<string, SlotStatus>>({});
  const [fullyBookedDates, setFullyBookedDates] = useState<Set<string>>(new Set());
  const [closedDates, setClosedDates] = useState<Set<string>>(new Set());
  const [loadingSlots, startSlotTransition] = useTransition();
  const [loadingFullyBooked, setLoadingFullyBooked] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [showAddressErrors, setShowAddressErrors] = useState(false);

  const emptyAddress: AddressValue = {
    provinceCode: "", provinceName: "",
    regencyCode: "", regencyName: "",
    districtCode: "", districtName: "",
    villageCode: "", villageName: "",
    addressDetail: "",
  };
  const [addressValue, setAddressValue] = useState<AddressValue>(emptyAddress);

  useEffect(() => {
    const today = new Date();
    const dateStr = toDateString(today);
    setLoadingFullyBooked(true);
    fetch(`/api/bookings/available-slots?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.fullyBookedDates)) {
          setFullyBookedDates(new Set(data.fullyBookedDates));
        }
        if (Array.isArray(data.closedDates)) {
          setClosedDates(new Set(data.closedDates));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFullyBooked(false));
  }, []);

  const loadSlotsForDate = useCallback((date: string) => {
    const loadingMap: Record<string, SlotStatus> = {};
    for (const s of TIME_SLOTS) loadingMap[s.value] = "loading";
    setSlotStatuses(loadingMap);
    setSelectedTime(null);
    startSlotTransition(async () => {
      try {
        const res = await fetch(`/api/bookings/available-slots?date=${date}`);
        const data = await res.json();
        const blocked: string[] = data.blockedSlots ?? [];
        const map: Record<string, SlotStatus> = {};
        for (const s of TIME_SLOTS) map[s.value] = blocked.includes(s.value) ? "blocked" : "available";
        setSlotStatuses(map);
      } catch {
        const map: Record<string, SlotStatus> = {};
        for (const s of TIME_SLOTS) map[s.value] = "available";
        setSlotStatuses(map);
      }
    });
  }, []);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep1Error(null);
    setHighlightCalendar(false);
    loadSlotsForDate(date);
  };

  const handleNextStep = () => {
    if (!selectedDate) {
      setHighlightCalendar(true);
      setHighlightTimeSlot(false);
      requestAnimationFrame(() => {
        if (calendarRef.current) {
          const top = calendarRef.current.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }
      });
      return;
    }
    if (!selectedTime) {
      setHighlightTimeSlot(true);
      setHighlightCalendar(false);
      requestAnimationFrame(() => {
        if (timeSlotRef.current) {
          const top = timeSlotRef.current.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }
      });
      return;
    }
    setHighlightCalendar(false);
    setHighlightTimeSlot(false);
    setStep1Error(null);
    setStep(2);
    requestAnimationFrame(() => {
      if (cardRef.current) {
        const top = cardRef.current.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  };

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setSelectedDate(null);
      setSelectedTime(null);
      setSlotStatuses({});
      setSelectedProductId("");
      setAddressValue(emptyAddress);
      setStep(1);
    }
  }, [state.success]);

  // -- Success --
  if (state.success) {
    return (
      <Card sx={{ p: 5, textAlign: "center", borderRadius: 1 }}>
        <Box
          sx={{
            display: "flex",
            mx: "auto",
            height: 64,
            width: 64,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            bgcolor: "rgba(22,163,74,0.1)",
            color: "success.main",
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 36 }} />
        </Box>
        <Typography variant="h6" sx={{ mt: 2, fontWeight: 700, color: "text.primary" }}>
          Booking terkirim!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
          Tim kami akan menghubungi Anda via WhatsApp dalam 1×24 jam.
        </Typography>
        {selectedDate && selectedTime && (
          <Chip
            icon={<EventAvailableIcon />}
            label={`${formatDisplayDate(selectedDate)}, pukul ${selectedTime}`}
            color="success"
            variant="outlined"
            sx={{ mt: 2, fontSize: "0.8rem" }}
          />
        )}
        <form action={() => window.location.reload()}>
          <Button type="submit" color="primary" sx={{ mt: 3, textDecoration: "underline", fontSize: "0.8rem", p: 0 }}>
            Kirim booking lain
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <Card ref={cardRef} sx={{ borderRadius: 1, boxShadow: compact ? "0 20px 50px rgba(0,0,0,0.25)" : "0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{ px: { xs: 3, md: 4 }, pt: { xs: 3, md: 4 }, pb: 0 }}>
        <StepIndicator step={step} />
      </Box>

      {/* -- Step 1: Jadwal & Paket -- */}
      {step === 1 && (
        <Box sx={{ px: { xs: 3, md: 4 }, pb: { xs: 3, md: 4 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <CalendarMonthIcon sx={{ fontSize: 20, color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
              Pilih Jadwal
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Pilih tanggal dan jam sesi foto Anda.
          </Typography>

          {step1Error && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 1, fontSize: "0.82rem" }}>
              {step1Error}
            </Alert>
          )}

          {/* Calendar + time slots container */}
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              overflow: "hidden",
              mb: 2,
            }}
          >
            {/* Calendar */}
            <Box ref={calendarRef} sx={{ p: { xs: 2, md: 2.5 }, borderBottom: "1px solid", borderColor: highlightCalendar ? "error.main" : "divider", transition: "border-color 0.2s", bgcolor: highlightCalendar ? "rgba(211,47,47,0.03)" : "transparent" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <CalendarMonthIcon sx={{ fontSize: 16, color: highlightCalendar ? "error.main" : "primary.main" }} />
                <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: highlightCalendar ? "error.main" : "text.primary" }}>
                  Tanggal {highlightCalendar && <Box component="span" sx={{ fontSize: "0.75rem", fontWeight: 400, ml: 1 }}>— wajib dipilih</Box>}
                </Typography>
                {selectedDate && (
                  <Chip
                    label={formatDisplayDate(selectedDate)}
                    size="small"
                    color="primary"
                    variant="outlined"
                    onDelete={() => { setSelectedDate(null); setSelectedTime(null); setSlotStatuses({}); }}
                    sx={{ fontSize: "0.7rem", ml: "auto" }}
                  />
                )}
              </Box>
              <BookingCalendar
                selectedDate={selectedDate}
                onSelect={handleDateSelect}
                fullyBookedDates={fullyBookedDates}
                closedDates={closedDates}
                loadingMonth={loadingFullyBooked}
              />
            </Box>

            {/* Time slots */}
            <Box ref={timeSlotRef} sx={{ p: { xs: 2, md: 2.5 }, bgcolor: highlightTimeSlot ? "rgba(211,47,47,0.03)" : "transparent", transition: "background-color 0.2s" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <AccessTimeIcon sx={{ fontSize: 16, color: highlightTimeSlot ? "error.main" : "primary.main" }} />
                <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: highlightTimeSlot ? "error.main" : "text.primary" }}>
                  Jam Mulai {highlightTimeSlot && <Box component="span" sx={{ fontSize: "0.75rem", fontWeight: 400, ml: 1 }}>— wajib dipilih</Box>}
                </Typography>
                {selectedTime && (
                  <Chip
                    label={`pukul ${selectedTime}`}
                    size="small"
                    color="primary"
                    onDelete={() => setSelectedTime(null)}
                    sx={{ fontSize: "0.7rem", ml: "auto" }}
                  />
                )}
              </Box>

              {!selectedDate ? (
                <Box
                  sx={{
                    py: 2.5,
                    textAlign: "center",
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    border: "1px dashed",
                    borderColor: "divider",
                  }}
                >
                  <CalendarMonthIcon sx={{ fontSize: 24, color: "text.disabled", mb: 0.5 }} />
                  <Typography variant="body2" color="text.disabled" sx={{ fontSize: "0.8rem" }}>
                    Pilih tanggal terlebih dahulu
                  </Typography>
                </Box>
              ) : (
                <>
                  <TimeSlotGrid
                    selectedTime={selectedTime}
                    onSelect={(t) => { setSelectedTime(t); setStep1Error(null); setHighlightTimeSlot(false); }}
                    slotStatuses={
                      loadingSlots
                        ? Object.fromEntries(TIME_SLOTS.map((s) => [s.value, "loading" as SlotStatus]))
                        : slotStatuses
                    }
                  />
                  <Box sx={{ display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
                    {[
                      { color: "#1D4ED8", label: "Dipilih" },
                      { color: "rgba(0,0,0,0.12)", label: "Terisi", strikethrough: true },
                      { color: "transparent", border: true, label: "Tersedia" },
                    ].map((item) => (
                      <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Box
                          sx={{
                            width: 11,
                            height: 11,
                            borderRadius: 0.5,
                            bgcolor: item.color,
                            border: item.border ? "1.5px solid" : "none",
                            borderColor: "divider",
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "0.7rem", textDecoration: item.strikethrough ? "line-through" : "none" }}
                        >
                          {item.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </Box>

          {/* Paket Layanan */}
          {products.length > 0 && (
            <>
              <Divider sx={{ my: 2.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ px: 1, fontSize: "0.75rem" }}>
                  Paket Layanan (opsional)
                </Typography>
              </Divider>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(200px, 1fr))" },
                  gap: 1.5,
                }}
              >
                <Box
                  component="button"
                  type="button"
                  onClick={() => setSelectedProductId("")}
                  sx={{
                    p: 1.75,
                    border: "1.5px solid",
                    borderRadius: 1,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                    ...(selectedProductId === ""
                      ? { borderColor: "primary.main", bgcolor: "rgba(29,78,216,0.06)" }
                      : { borderColor: "divider", bgcolor: "transparent", "&:hover": { borderColor: "primary.light" } }),
                  }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: "0.82rem", color: selectedProductId === "" ? "primary.main" : "text.secondary" }}>
                    Belum pilih paket
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "text.disabled", mt: 0.25 }}>
                    Konsultasi gratis dulu
                  </Typography>
                </Box>
                {products.map((p) => (
                  <Box
                    key={p.id}
                    component="button"
                    type="button"
                    onClick={() => setSelectedProductId(p.id)}
                    sx={{
                      p: 1.75,
                      border: "1.5px solid",
                      borderRadius: 1,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                      ...(selectedProductId === p.id
                        ? { borderColor: "primary.main", bgcolor: "rgba(29,78,216,0.06)", boxShadow: "0 0 0 3px rgba(29,78,216,0.12)" }
                        : { borderColor: "divider", bgcolor: "transparent", "&:hover": { borderColor: "primary.light" } }),
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          color: selectedProductId === p.id ? "primary.main" : "text.primary",
                        }}
                      >
                        {p.name}
                      </Typography>
                      {p.isPopular && (
                        <Box
                          sx={{
                            bgcolor: "primary.main",
                            color: "#fff",
                            px: 1,
                            py: 0.25,
                            borderRadius: 0.5,
                            fontWeight: 700,
                            fontSize: "0.62rem",
                            lineHeight: 1.6,
                            flexShrink: 0,
                          }}
                        >
                          POPULER
                        </Box>
                      )}
                    </Box>
                    <Typography sx={{ fontSize: "0.8rem", color: "primary.main", fontWeight: 600, mt: 0.25 }}>
                      {formatPrice(p.price)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* Summary */}
          {selectedDate && selectedTime && (
            <Alert
              severity="info"
              icon={<EventAvailableIcon fontSize="small" />}
              sx={{ mt: 2.5, borderRadius: 1, fontSize: "0.82rem", py: 0.5 }}
            >
              <strong>{formatDisplayDate(selectedDate)}</strong> pukul <strong>{selectedTime}</strong>
              {selectedProductId && products.find((p) => p.id === selectedProductId) && (
                <> · Paket <strong>{products.find((p) => p.id === selectedProductId)!.name}</strong></>
              )}
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleNextStep}
            sx={{
              mt: 2.5,
              py: 1.5,
              fontSize: "1rem",
              fontWeight: 700,
              borderRadius: 1,
            }}
          >
            Lanjut Isi Data Booking
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 1 }}>
            {scheduleNote ?? "Jam operasional Senin–Sabtu, 09:00–16:00"}
          </Typography>
        </Box>
      )}

      {/* -- Step 2: Data Diri -- */}
      {step === 2 && (
        <Box sx={{ px: { xs: 3, md: 4 }, pb: { xs: 3, md: 4 } }}>
          {/* Jadwal summary bar */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              mb: 3,
              p: 1.5,
              bgcolor: "rgba(29,78,216,0.05)",
              borderRadius: 1,
              border: "1px solid rgba(29,78,216,0.12)",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <EventAvailableIcon sx={{ fontSize: 16, color: "primary.main", flexShrink: 0 }} />
            <Typography sx={{ fontSize: "0.8rem", color: "text.primary", flex: 1 }}>
              <strong>{formatDisplayDate(selectedDate!)}</strong> · pukul <strong>{selectedTime}</strong>
              {selectedProductId && products.find((p) => p.id === selectedProductId) && (
                <> · <strong>{products.find((p) => p.id === selectedProductId)!.name}</strong></>
              )}
            </Typography>
            <Button
              size="small"
              startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />}
              onClick={() => setStep(1)}
              sx={{ fontSize: "0.75rem", py: 0.25, px: 1, minWidth: "auto", flexShrink: 0 }}
            >
              Ubah
            </Button>
          </Stack>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <PersonIcon sx={{ fontSize: 20, color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
              Data Diri
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Isi informasi Anda agar tim kami bisa menghubungi lewat WhatsApp.
          </Typography>

          {state.error && (
            <Alert
              severity={state.error.includes("terisi") || state.error.includes("operasional") ? "warning" : "error"}
              sx={{ mb: 2, borderRadius: 1, fontSize: "0.82rem" }}
            >
              {state.error}
            </Alert>
          )}

          <Box ref={formRef} component="form" action={formAction} onSubmit={(e) => {
              const missing = !addressValue.provinceCode || !addressValue.regencyCode || !addressValue.districtCode || !addressValue.villageCode || !addressValue.addressDetail.trim();
              if (missing) { e.preventDefault(); setShowAddressErrors(true); return; }
            }} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <input type="hidden" name="preferredDate" value={selectedDate ?? ""} />
            <input type="hidden" name="preferredTime" value={selectedTime ?? ""} />
            <input type="hidden" name="productId" value={selectedProductId} />

            <TextField
              name="name"
              label="Nama Lengkap"
              required
              size="small"
              fullWidth
              error={!!state.fieldErrors?.name}
              helperText={state.fieldErrors?.name?.[0]}
            />
            <TextField
              name="phone"
              label="No HP / WhatsApp"
              required
              size="small"
              fullWidth
              inputMode="tel"
              error={!!state.fieldErrors?.phone}
              helperText={state.fieldErrors?.phone?.[0]}
            />

            {/* Alamat: wilayah + detail */}
            <AddressFields
              value={addressValue}
              onChange={setAddressValue}
              fieldErrors={state.fieldErrors}
              showErrors={showAddressErrors}
            />
            {/* Hidden field address yang di-compose untuk server action */}
            <input
              type="hidden"
              name="address"
              value={[
                addressValue.addressDetail,
                addressValue.villageName,
                addressValue.districtName,
                addressValue.regencyName,
                addressValue.provinceName,
              ].filter(Boolean).join(", ")}
            />
            <FormControl size="small" fullWidth required>
              <InputLabel>Tipe Properti</InputLabel>
              <MuiSelect name="propertyType" label="Tipe Properti" defaultValue="RUMAH">
                {PROPERTY_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              disabled={pending}
              size="large"
              sx={{
                mt: 0.5,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 700,
                borderRadius: 1,
              }}
            >
              {pending ? "Mengirim..." : "Kirim Booking"}
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
              Dengan mengirim, Anda setuju dihubungi via WhatsApp. Jadwal bersifat tentatif, dikonfirmasi tim kami.
            </Typography>
          </Box>
        </Box>
      )}
    </Card>
  );
}
