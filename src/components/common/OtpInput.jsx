import React from "react";

export default function OtpInput({ value, onChange, disabled, length = 6 }) {
  const [otp, setOtp] = React.useState(Array(length).fill(""));

  React.useEffect(() => {
    if (value) {
      const chars = value.split("").slice(0, length);
      setOtp(chars.concat(Array(length - chars.length).fill("")));
    } else {
      setOtp(Array(length).fill(""));
    }
  }, [value, length]);

  const handleChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    const otpString = newOtp.join("");
    onChange(otpString);

    if (val && index < length - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array(length)
        .fill(0)
        .map((_, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="password"
            maxLength="1"
            value={otp[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={disabled}
            className="w-10 h-10 text-center text-lg font-bold rounded-lg border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        ))}
    </div>
  );
}
