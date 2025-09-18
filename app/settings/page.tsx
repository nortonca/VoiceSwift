"use client";

import { useState } from "react";
import { ProfileSection } from "./components/ProfileSection";
import { BillingSection } from "./components/BillingSection";
import { SecuritySection } from "./components/SecuritySection";
import { SaveButton } from "./components/SaveButton";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const [name, setName] = useState("Alex Thompson");
  const [email, setEmail] = useState("alex@example.com");
  const [company, setCompany] = useState("Annulus");
  const [twofa, setTwofa] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    }, 700);
  };

  return (
    <div className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full space-y-6">
      {/* Header Section */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-2">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white/90">Settings</h3>
        </div>
        <p className="text-sm text-white/60">Manage your account preferences and security settings.</p>
      </div>

      <ProfileSection
        name={name}
        onNameChange={setName}
        email={email}
        onEmailChange={setEmail}
        company={company}
        onCompanyChange={setCompany}
      />

      <BillingSection />

      <SecuritySection
        twofa={twofa}
        onTwofaChange={setTwofa}
      />

      <SaveButton
        saving={saving}
        saved={saved}
        onSave={save}
      />
    </div>
  );
}


