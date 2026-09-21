import { useEffect, useMemo, useState } from "react";

// Country calling codes are shown as flag + code only. Names are intentionally
// omitted from the selector to keep the control compact.
const COUNTRY_RULES = [
  ["🇦🇬", "+1", 10], ["🇧🇸", "+1", 10], ["🇩🇲", "+1", 10], ["🇬🇩", "+1", 10], ["🇰🇳", "+1", 10], ["🇱🇨", "+1", 10], ["🇻🇨", "+1", 10], ["🇹🇹", "+1", 10],
  ["🇦🇫", "+93", 9], ["🇦🇱", "+355", 8], ["🇩🇿", "+213", 9], ["🇦🇩", "+376", 6], ["🇦🇴", "+244", 9],
  ["🇦🇷", "+54", 10], ["🇦🇲", "+374", 8], ["🇦🇺", "+61", 9], ["🇦🇹", "+43", 10], ["🇦🇿", "+994", 9],
  ["🇧🇭", "+973", 8], ["🇧🇩", "+880", 10], ["🇧🇧", "+1", 10], ["🇧🇾", "+375", 9], ["🇧🇪", "+32", 9],
  ["🇧🇿", "+501", 7], ["🇧🇯", "+229", 8], ["🇧🇹", "+975", 8], ["🇧🇴", "+591", 8], ["🇧🇦", "+387", 8],
  ["🇧🇼", "+267", 8], ["🇧🇷", "+55", 10], ["🇧🇳", "+673", 7], ["🇧🇬", "+359", 9], ["🇧🇫", "+226", 8],
  ["🇰🇭", "+855", 8], ["🇨🇲", "+237", 9], ["🇨🇦", "+1", 10], ["🇨🇻", "+238", 7], ["🇨🇫", "+236", 8],
  ["🇹🇩", "+235", 8], ["🇨🇱", "+56", 9], ["🇨🇳", "+86", 11], ["🇨🇴", "+57", 10], ["🇰🇲", "+269", 7],
  ["🇨🇬", "+242", 9], ["🇨🇩", "+243", 9], ["🇨🇷", "+506", 8], ["🇨🇮", "+225", 10], ["🇭🇷", "+385", 8],
  ["🇨🇾", "+357", 8], ["🇨🇿", "+420", 9], ["🇩🇰", "+45", 8], ["🇩🇯", "+253", 8], ["🇩🇴", "+1", 10],
  ["🇪🇨", "+593", 9], ["🇪🇬", "+20", 10], ["🇸🇻", "+503", 8], ["🇬🇶", "+240", 9], ["🇪🇷", "+291", 7],
  ["🇪🇪", "+372", 8], ["🇸🇿", "+268", 8], ["🇪🇹", "+251", 9], ["🇫🇯", "+679", 7], ["🇫🇮", "+358", 9],
  ["🇫🇷", "+33", 9], ["🇬🇦", "+241", 8], ["🇬🇲", "+220", 7], ["🇬🇪", "+995", 9], ["🇩🇪", "+49", 10],
  ["🇬🇭", "+233", 9], ["🇬🇷", "+30", 10], ["🇬🇩", "+1", 10], ["🇬🇹", "+502", 8], ["🇬🇳", "+224", 9],
  ["🇬🇼", "+245", 7], ["🇬🇾", "+592", 7], ["🇭🇹", "+509", 8], ["🇭🇳", "+504", 8], ["🇭🇺", "+36", 9],
  ["🇮🇸", "+354", 7], ["🇮🇳", "+91", 10], ["🇮🇩", "+62", 9], ["🇮🇷", "+98", 10], ["🇮🇶", "+964", 10],
  ["🇮🇪", "+353", 9], ["🇮🇱", "+972", 9], ["🇮🇹", "+39", 10], ["🇯🇲", "+1", 10], ["🇯🇵", "+81", 10],
  ["🇯🇴", "+962", 9], ["🇰🇿", "+7", 10], ["🇰🇪", "+254", 9], ["🇰🇮", "+686", 5], ["🇰🇼", "+965", 8],
  ["🇰🇬", "+996", 9], ["🇱🇦", "+856", 9], ["🇱🇻", "+371", 8], ["🇱🇧", "+961", 8], ["🇱🇸", "+266", 8],
  ["🇱🇷", "+231", 7], ["🇱🇾", "+218", 9], ["🇱🇮", "+423", 7], ["🇱🇹", "+370", 8], ["🇱🇺", "+352", 9],
  ["🇲🇬", "+261", 9], ["🇲🇼", "+265", 9], ["🇲🇾", "+60", 9], ["🇲🇻", "+960", 7], ["🇲🇱", "+223", 8],
  ["🇲🇹", "+356", 8], ["🇲🇷", "+222", 8], ["🇲🇺", "+230", 8], ["🇲🇽", "+52", 10], ["🇲🇩", "+373", 8],
  ["🇲🇨", "+377", 8], ["🇲🇳", "+976", 8], ["🇲🇪", "+382", 8], ["🇲🇦", "+212", 9], ["🇲🇿", "+258", 9],
  ["🇲🇲", "+95", 9], ["🇳🇦", "+264", 9], ["🇳🇵", "+977", 10], ["🇳🇱", "+31", 9], ["🇳🇿", "+64", 9],
  ["🇳🇮", "+505", 8], ["🇳🇪", "+227", 8], ["🇳🇬", "+234", 10], ["🇲🇰", "+389", 8], ["🇳🇴", "+47", 8],
  ["🇴🇲", "+968", 8], ["🇵🇰", "+92", 10], ["🇵🇦", "+507", 8], ["🇵🇬", "+675", 8], ["🇵🇾", "+595", 9],
  ["🇵🇪", "+51", 9], ["🇵🇭", "+63", 10], ["🇵🇱", "+48", 9], ["🇵🇹", "+351", 9], ["🇶🇦", "+974", 8],
  ["🇷🇴", "+40", 9], ["🇷🇺", "+7", 10], ["🇷🇼", "+250", 9], ["🇸🇦", "+966", 9], ["🇸🇳", "+221", 9],
  ["🇷🇸", "+381", 8], ["🇸🇨", "+248", 7], ["🇸🇱", "+232", 8], ["🇸🇬", "+65", 8], ["🇸🇰", "+421", 9],
  ["🇸🇮", "+386", 8], ["🇸🇴", "+252", 8], ["🇿🇦", "+27", 9], ["🇰🇷", "+82", 10], ["🇸🇸", "+211", 9],
  ["🇪🇸", "+34", 9], ["🇱🇰", "+94", 9], ["🇸🇩", "+249", 9], ["🇸🇷", "+597", 7], ["🇸🇪", "+46", 9],
  ["🇨🇭", "+41", 9], ["🇸🇾", "+963", 9], ["🇹🇯", "+992", 9], ["🇹🇿", "+255", 9], ["🇹🇭", "+66", 9],
  ["🇹🇱", "+670", 8], ["🇹🇬", "+228", 8], ["🇹🇴", "+676", 5], ["🇹🇳", "+216", 8], ["🇹🇷", "+90", 10],
  ["🇹🇲", "+993", 8], ["🇺🇬", "+256", 9], ["🇺🇦", "+380", 9], ["🇦🇪", "+971", 9], ["🇬🇧", "+44", 10],
  ["🇺🇸", "+1", 10], ["🇺🇾", "+598", 8], ["🇺🇿", "+998", 9], ["🇻🇦", "+39", 10], ["🇻🇪", "+58", 10],
  ["🇻🇳", "+84", 9], ["🇾🇪", "+967", 9], ["🇿🇲", "+260", 9], ["🇿🇼", "+263", 9], ["🇹🇨", "+1", 10], ["🇻🇬", "+1", 10], ["🇰🇾", "+1", 10], ["🇧🇲", "+1", 10], ["🇨🇻", "+238", 7]
].map(([flag, code, digits]) => ({ flag, code, digits }));

const normalizePhone = (value) => String(value || "").replace(/\D/g, "");
const PK = { flag: "🇵🇰", code: "+92", digits: 10 };

const selectedFromValue = (value) => {
  const raw = String(value || "").trim();
  if (!raw.startsWith("+")) return PK;
  const matches = COUNTRY_RULES.filter((item) => raw.startsWith(item.code));
  return matches.sort((a, b) => b.code.length - a.code.length)[0] || PK;
};

export const isValidInternationalPhone = (value, selectedCountry = null) => {
  const raw = String(value || "").trim();
  if (!/^\+\d+$/.test(raw)) return false;
  const country = selectedCountry || selectedFromValue(raw);
  if (!raw.startsWith(country.code)) return false;
  const national = normalizePhone(raw.slice(country.code.length));
  return new RegExp(`^\\d{${country.digits}}$`).test(national);
};

export default function PhoneInput({ value, onChange, required = true, label = "Phone number", disabled = false }) {
  const initialCountry = useMemo(() => selectedFromValue(value), [value]);
  const [country, setCountry] = useState(initialCountry);
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const next = selectedFromValue(value);
    setCountry(next);
  }, [value]);

  const rawValue = String(value || "");
  const nationalValue = rawValue.startsWith(country.code)
    ? rawValue.slice(country.code.length).replace(/\D/g, "")
    : normalizePhone(rawValue).slice(0, country.digits);
  const valid = isValidInternationalPhone(value, country);

  const chooseCountry = (next) => {
    setCountry(next);
    const digits = normalizePhone(nationalValue).slice(0, next.digits);
    onChange(digits ? `${next.code}${digits}` : "");
    setOpen(false);
    setTouched(true);
  };

  return <div className="relative">
    <label className="block text-xs font-semibold text-[#718079]">{label}{required ? " *" : ""}</label>
    <div className="mt-2 flex gap-2">
      <div className="relative w-[112px] shrink-0">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className="input flex h-12 w-full items-center justify-center gap-1 px-2 text-center"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span aria-hidden="true" className="text-lg leading-none">{country.flag}</span>
          <span>{country.code}</span>
          <span className="ml-auto text-[10px] text-[#71878b]">▾</span>
        </button>
        {open && <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close country list" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-64 w-56 overflow-y-auto rounded-xl border border-[#263746] bg-[#101d2a] p-1 shadow-2xl" role="listbox">
            {COUNTRY_RULES.map((item, index) => <button
              key={`${item.code}-${item.flag}-${index}`}
              type="button"
              role="option"
              aria-selected={item.code === country.code && item.flag === country.flag}
              onClick={() => chooseCountry(item)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-[#173f34] ${item.code === country.code && item.flag === country.flag ? "bg-[#173f34] text-[#9ee8c0]" : "text-white"}`}
            >
              <span className="text-lg" aria-hidden="true">{item.flag}</span><span className="font-semibold">{item.code}</span>
            </button>)}
          </div>
        </>}
      </div>
      <input
        value={nationalValue}
        required={required}
        disabled={disabled}
        inputMode="numeric"
        autoComplete="tel-national"
        onBlur={() => setTouched(true)}
        onChange={(e) => onChange(`${country.code}${e.target.value.replace(/\D/g, "").slice(0, country.digits)}`)}
        placeholder={"0".repeat(country.digits)}
        className={`input h-12 flex-1 ${touched && value && !valid ? "border-red-500" : ""}`}
        aria-invalid={Boolean(touched && value && !valid)}
      />
    </div>
    <p className={`mt-1.5 text-xs ${touched && value && !valid ? "text-red-400" : "text-[#819088]"}`}>
      {touched && value && !valid ? `Enter a valid ${country.code} phone number.` : "Select the flag/code and enter the local number."}
    </p>
  </div>;
}
