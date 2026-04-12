export default function AuthCheckbox({ checked, label, name, onChange }) {
  return (
    <label className="login-ui__checkbox">
      <input
        checked={checked}
        className="login-ui__checkbox-input"
        name={name}
        onChange={onChange}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}
