export default function ActionIconButton({
  icon,
  label,
  onClick,
  disabled = false,
  title = label,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-md text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent ${className}`}
    >
      <span className="material-symbols-outlined text-[28px] leading-none">
        {icon}
      </span>
    </button>
  );
}
