
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const FIELDS = [
  "Computer Science & AI",
  "Biomedical & Life Sciences",
  "Physics & Quantum Computing",
  "Materials Science & Chemistry",
  "Economics & Social Sciences",
  "Environmental Science",
];

export default function OnboardingPage() {
  const router = useRouter();

  const [selectedFields, setSelectedFields] = useState<string[]>([
    "Computer Science & AI",
  ]);
  const [professionalRole, setProfessionalRole] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const supabase = createClient();
        const { data, error: authError } = await supabase.auth.getUser();

        if (authError || !data.user) {
          router.replace("/auth/login");
          return;
        }

        const metadata = data.user.user_metadata ?? {};
        const role =
          typeof metadata.professional_role === "string"
            ? metadata.professional_role.trim()
            : "";

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("disciplines")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!active) return;

        setProfessionalRole(role);

        if (profile?.disciplines?.length) {
          setSelectedFields(profile.disciplines);
        }
      } catch {
        if (active) {
          setError("Unable to load your profile. Please try again.");
        }
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  function toggleField(field: string) {
    setSelectedFields((current) =>
      current.includes(field)
        ? current.filter((item) => item !== field)
        : [...current, field]
    );
  }

  async function handleCompleteSetup() {
    setError("");

    if (selectedFields.length === 0) {
      setError("Select at least one research discipline.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        router.replace("/auth/login");
        return;
      }

      const user = authData.user;
      const metadata = user.user_metadata ?? {};

      const fullName =
        typeof metadata.full_name === "string"
          ? metadata.full_name.trim()
          : "";

      const institution =
        typeof metadata.institution === "string"
          ? metadata.institution.trim()
          : "";

      const { data: existingProfile, error: lookupError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (lookupError) {
        throw lookupError;
      }

      const profileValues = {
        email: user.email ?? "",
        full_name: fullName || null,
        institution: institution || null,
        disciplines: selectedFields,
      };

      const { error: saveError } = existingProfile
        ? await supabase
            .from("profiles")
            .update(profileValues)
            .eq("id", user.id)
        : await supabase.from("profiles").insert({
            id: user.id,
            ...profileValues,
          });

      if (saveError) {
        throw saveError;
      }

      router.replace("/app/dashboard");
      router.refresh();
    } catch {
      setError(
        "Unable to save your profile. Check your connection and permissions, then try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA] px-5 py-10 text-[#212529] sm:px-8">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-2xl flex-col justify-center">
        <header className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <BookOpen size={22} />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight">
              Dr. Publish
            </p>
            <p className="text-xs text-gray-500">
              From Research Draft to Publication Ready
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">
          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              Personalize your workspace
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Tell us about your research
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Choose your research disciplines so your workspace can reflect
              your areas of focus.
            </p>
          </div>

          {professionalRole && (
            <div className="mb-7 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <GraduationCap
                size={21}
                className="mt-0.5 shrink-0 text-blue-600"
              />
              <div>
                <p className="text-xs text-gray-500">
                  Your selected professional role
                </p>
                <p className="mt-1 text-sm font-medium">{professionalRole}</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  This is profile information, not an access permission.
                </p>
              </div>
            </div>
          )}

          <div className="mb-4 flex items-center gap-2">
            <Layers size={18} className="text-gray-500" />
            <h2 className="text-sm font-semibold">Research disciplines</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FIELDS.map((field) => {
              const isSelected = selectedFields.includes(field);

              return (
                <button
                  key={field}
                  type="button"
                  onClick={() => toggleField(field)}
                  aria-pressed={isSelected}
                  disabled={loadingProfile || saving}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-800"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <span>{field}</span>
                  {isSelected && (
                    <CheckCircle2
                      size={18}
                      className="shrink-0 text-blue-600"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleCompleteSetup}
            disabled={loadingProfile || saving}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingProfile
              ? "Loading your profile..."
              : saving
                ? "Saving your setup..."
                : "Complete setup"}
            {!loadingProfile && !saving && <ArrowRight size={17} />}
          </button>

          <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-gray-500">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" />
            <p>
              Your research remains yours. Dr. Publish assists your workflow;
              you remain in control of your research and publication decisions.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
