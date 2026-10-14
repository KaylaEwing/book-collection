"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

// Creates an account with Supabase Auth. The password is hashed and stored by
// Supabase; the username is saved with the account and copied into the
// profiles table by a database trigger.
export default function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState({ username: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function update(e) {
    setValues({ ...values, [e.target.name]: e.target.value });
  }

  function validate() {
    const next = {};
    if (values.username.trim().length < 3) next.username = "Use at least 3 characters.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) next.email = "Enter a valid email address.";
    if (values.password.length < 8) next.password = "Use at least 8 characters.";
    if (values.confirm !== values.password) next.confirm = "The passwords don't match.";
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    setNotice("");
    const result = await register({
      email: values.email.trim(),
      password: values.password,
      username: values.username.trim(),
    });
    setBusy(false);

    if (result.error) {
      setErrors({ email: result.error });
      return;
    }
    if (result.needsConfirmation) {
      setNotice("Check your email for a confirmation link, then log in.");
      return;
    }
    router.push("/books");
    router.refresh();
  }

  const fields = [
    { name: "username", label: "Username", type: "text", auto: "username", hint: "Shown in the navigation bar" },
    { name: "email", label: "Email", type: "email", auto: "email" },
    { name: "password", label: "Password", type: "password", auto: "new-password", hint: "At least 8 characters" },
    { name: "confirm", label: "Confirm password", type: "password", auto: "new-password" },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 20, marginTop: 32, textAlign: "left" }}>
      {fields.map((f) => (
        <div className="field" key={f.name}>
          <label htmlFor={f.name} className="field-label">{f.label}</label>
          {f.hint && <span id={`${f.name}-hint`} className="field-hint">{f.hint}</span>}
          <input
            id={f.name}
            name={f.name}
            type={f.type}
            autoComplete={f.auto}
            className="input"
            value={values[f.name]}
            onChange={update}
            aria-invalid={errors[f.name] ? "true" : undefined}
            aria-describedby={[f.hint && `${f.name}-hint`, errors[f.name] && `${f.name}-error`].filter(Boolean).join(" ") || undefined}
          />
          {errors[f.name] && (
            <span id={`${f.name}-error`} className="error-text">{errors[f.name]}</span>
          )}
        </div>
      ))}

      {notice && <p className="lead" role="status">{notice}</p>}

      <div className="button-row center-row">
        <button type="submit" className="btn-light" disabled={busy}>
          {busy ? "CREATING…" : "REGISTER"}
        </button>
      </div>
    </form>
  );
}
