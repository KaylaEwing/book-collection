"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState({ username: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});

  function update(e) {
    setValues({ ...values, [e.target.name]: e.target.value });
  }

  function validate() {
    const next = {};
    if (values.username.trim().length < 3) next.username = "Use at least 3 characters.";
    if (values.password.length < 8) next.password = "Use at least 8 characters.";
    if (values.confirm !== values.password) next.confirm = "The passwords don't match.";
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    // TODO (backend): replace with supabase.auth.signUp()
    const result = register(values.username);
    if (result.error) {
      setErrors({ username: result.error });
      return;
    }
    router.push("/books");
  }

  const fields = [
    { name: "username", label: "Username", type: "text", auto: "username" },
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
      <div className="button-row center-row">
        <button type="submit" className="btn-light">REGISTER</button>
      </div>
    </form>
  );
}
