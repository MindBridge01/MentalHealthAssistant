export default function InputField({
  autoComplete,
  error,
  id,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}) {
  return (
    <label className="login-ui__field" htmlFor={id}>
      <span className="login-ui__field-label">{label}</span>
      <input
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className="login-ui__field-input"
        id={id}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}
