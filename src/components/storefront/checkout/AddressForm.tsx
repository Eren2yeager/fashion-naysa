"use client";

import { useState } from "react";
import { z } from "zod";
import { addressSchema } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";

type Address = z.infer<typeof addressSchema>;

interface AddressFormProps {
  onSubmit: (address: Address) => void;
  loading?: boolean;
}

type FieldErrors = Partial<Record<keyof Address, string>>;

const FIELDS: {
  name: keyof Address;
  label: string;
  type?: string;
  placeholder: string;
  required?: boolean;
}[] = [
  { name: "fullName", label: "Full Name", placeholder: "Jane Doe", required: true },
  { name: "phone", label: "Phone", type: "tel", placeholder: "10-digit mobile number", required: true },
  { name: "line1", label: "Address Line 1", placeholder: "House / Flat / Street", required: true },
  { name: "line2", label: "Address Line 2", placeholder: "Landmark, Area (optional)" },
  { name: "city", label: "City", placeholder: "Mumbai", required: true },
  { name: "state", label: "State", placeholder: "Maharashtra", required: true },
  { name: "pincode", label: "Pincode", placeholder: "6-digit pincode", required: true },
];

export default function AddressForm({ onSubmit, loading = false }: AddressFormProps) {
  const [values, setValues] = useState<Record<string, string>>({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "IN",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleChange(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name as keyof Address]) {
      setErrors((e) => ({ ...e, [name]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = addressSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof Address;
        if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(result.data);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {FIELDS.map(({ name, label, type = "text", placeholder, required }) => (
        <div key={name} className="space-y-1">
          <label
            htmlFor={`address-${name}`}
            className="block text-xs tracking-widest uppercase text-muted-foreground"
          >
            {label}
            {required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
          </label>
          <input
            id={`address-${name}`}
            type={type}
            autoComplete={name === "fullName" ? "name" : name === "phone" ? "tel" : name === "line1" ? "address-line1" : name === "line2" ? "address-line2" : name === "city" ? "address-level2" : name === "state" ? "address-level1" : name === "pincode" ? "postal-code" : undefined}
            value={values[name] ?? ""}
            onChange={(e) => handleChange(name, e.target.value)}
            placeholder={placeholder}
            aria-required={required}
            aria-invalid={!!errors[name as keyof Address]}
            aria-describedby={errors[name as keyof Address] ? `error-${name}` : undefined}
            className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring aria-invalid:border-destructive"
          />
          {errors[name as keyof Address] && (
            <p id={`error-${name}`} role="alert" className="text-xs text-destructive">
              {errors[name as keyof Address]}
            </p>
          )}
        </div>
      ))}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Processing…" : "Continue to Payment"}
      </Button>
    </form>
  );
}
