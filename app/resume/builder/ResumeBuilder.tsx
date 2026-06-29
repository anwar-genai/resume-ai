"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassCard from "@/app/components/ui/GlassCard";
import Button from "@/app/components/ui/Button";
import { Input, Textarea } from "@/app/components/ui/Input";
import ResumeRenderer from "@/app/components/resume/ResumeRenderer";
import AtsAnalysis from "@/app/components/AtsAnalysis";
import { renderResumeText } from "@/lib/resumeRender";
import { fileToSquareDataUrl } from "@/lib/image";
import {
  TEMPLATES,
  emptyResumeData,
  type ResumeData,
  type Experience,
  type Education,
  type Project,
  type Certification,
  type TemplateId,
} from "@/lib/resumeSchema";

const emptyExperience = (): Experience => ({ company: "", role: "", location: "", startDate: "", endDate: "", bullets: [""] });
const emptyEducation = (): Education => ({ school: "", degree: "", field: "", location: "", startDate: "", endDate: "" });
const emptyProject = (): Project => ({ name: "", description: "", link: "", bullets: [""] });
const emptyCert = (): Certification => ({ name: "", issuer: "", date: "" });

export default function ResumeBuilder() {
  const router = useRouter();
  const params = useSearchParams();
  const idParam = params.get("id");

  const [data, setData] = useState<ResumeData>(emptyResumeData());
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<TemplateId>("ats");
  const [savedId, setSavedId] = useState<string | null>(idParam);
  const [loading, setLoading] = useState(Boolean(idParam));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Pick up a JD handed off from the optimizer (/resume) for the ATS panel.
  useEffect(() => {
    const jd = sessionStorage.getItem("resumeJd");
    if (jd) {
      setJobDescription(jd);
      sessionStorage.removeItem("resumeJd");
    }
  }, []);

  // Load existing resume when editing.
  useEffect(() => {
    if (!idParam) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/resumes/${idParam}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load resume");
        if (!active) return;
        if (json.data) setData(json.data as ResumeData);
        setTitle(json.title || "");
        setTemplate((json.template as TemplateId) || "ats");
      } catch (e) {
        alert((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [idParam]);

  function patch(updater: (d: ResumeData) => ResumeData) {
    setData((d) => updater(structuredClone(d)));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      const body = JSON.stringify({ title, template, data });
      const res = savedId
        ? await fetch(`/api/resumes/${savedId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body })
        : await fetch(`/api/resumes`, { method: "POST", headers: { "Content-Type": "application/json" }, body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      if (!savedId && json.id) {
        setSavedId(json.id);
        router.replace(`/resume/builder?id=${json.id}`);
      }
      setDirty(false);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onPhotoPick(file: File) {
    try {
      const dataUrl = await fileToSquareDataUrl(file);
      patch((d) => ({ ...d, photo: dataUrl }));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (loading) return <div className="p-6 text-center text-gray-500">Loading editor…</div>;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">
            {idParam ? "Edit Resume" : "Build a Resume"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Fill in the sections — the preview updates live.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={save} disabled={saving} variant="primary" size="md">
            {saving ? "Saving…" : savedId ? (dirty ? "Save changes" : "Saved") : "Save resume"}
          </Button>
          {savedId && (
            <>
              <Button variant="secondary" size="md" onClick={() => window.open(`/api/export/resume/${savedId}?format=pdf`, "_blank")}>
                PDF
              </Button>
              <Button variant="secondary" size="md" onClick={() => window.open(`/api/export/resume/${savedId}?format=docx`, "_blank")}>
                Word
              </Button>
              <Button variant="secondary" size="md" onClick={() => router.push(`/cover-letter?resumeId=${savedId}`)}>
                Cover letter
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---- Form ---- */}
        <div className="space-y-5">
          {/* Meta */}
          <GlassCard className="p-5 space-y-4">
            <Input label="Resume title (for your reference)" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Frontend Engineer – 2026" />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Template</label>
              <div className="flex gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setTemplate(t.id); setDirty(true); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      template === t.id ? "bg-indigo-600 text-white shadow" : "bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Contact */}
          <Section title="Contact">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Full name" value={data.contact.name} onChange={(e) => patch((d) => ({ ...d, contact: { ...d.contact, name: e.target.value } }))} />
              <Input label="Headline / title" value={data.contact.title} onChange={(e) => patch((d) => ({ ...d, contact: { ...d.contact, title: e.target.value } }))} />
              <Input label="Email" value={data.contact.email} onChange={(e) => patch((d) => ({ ...d, contact: { ...d.contact, email: e.target.value } }))} />
              <Input label="Phone" value={data.contact.phone} onChange={(e) => patch((d) => ({ ...d, contact: { ...d.contact, phone: e.target.value } }))} />
              <Input label="Location" value={data.contact.location} onChange={(e) => patch((d) => ({ ...d, contact: { ...d.contact, location: e.target.value } }))} />
            </div>

            {/* Links */}
            <div className="mt-3 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Links</label>
              {data.contact.links.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="Label (LinkedIn)" value={l.label} onChange={(e) => patch((d) => { d.contact.links[i].label = e.target.value; return d; })} />
                  <Input placeholder="https://…" value={l.url} onChange={(e) => patch((d) => { d.contact.links[i].url = e.target.value; return d; })} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => patch((d) => { d.contact.links.splice(i, 1); return d; })}>✕</Button>
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={() => patch((d) => { d.contact.links.push({ label: "", url: "" }); return d; })}>+ Add link</Button>
            </div>

            {/* Photo (modern only) */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Photo (Modern template only)</label>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhotoPick(f); e.currentTarget.value = ""; }} />
              <div className="flex items-center gap-3">
                {data.photo && <img src={data.photo} alt="" className="w-12 h-12 rounded-full object-cover" />}
                <Button type="button" variant="secondary" size="sm" onClick={() => photoInputRef.current?.click()}>{data.photo ? "Change" : "Upload"}</Button>
                {data.photo && <Button type="button" variant="ghost" size="sm" onClick={() => patch((d) => ({ ...d, photo: "" }))}>Remove</Button>}
              </div>
            </div>
          </Section>

          {/* Summary */}
          <Section title="Summary">
            <Textarea rows={4} value={data.summary} onChange={(e) => patch((d) => ({ ...d, summary: e.target.value }))} placeholder="2–4 sentence professional summary" />
          </Section>

          {/* Experience */}
          <Section title="Experience" onAdd={() => patch((d) => ({ ...d, experience: [...d.experience, emptyExperience()] }))}>
            {data.experience.map((exp, i) => (
              <EntryCard key={i} onRemove={() => patch((d) => { d.experience.splice(i, 1); return d; })}>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input placeholder="Role" value={exp.role} onChange={(e) => patch((d) => { d.experience[i].role = e.target.value; return d; })} />
                  <Input placeholder="Company" value={exp.company} onChange={(e) => patch((d) => { d.experience[i].company = e.target.value; return d; })} />
                  <Input placeholder="Location" value={exp.location} onChange={(e) => patch((d) => { d.experience[i].location = e.target.value; return d; })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Start (2021)" value={exp.startDate} onChange={(e) => patch((d) => { d.experience[i].startDate = e.target.value; return d; })} />
                    <Input placeholder="End (Present)" value={exp.endDate} onChange={(e) => patch((d) => { d.experience[i].endDate = e.target.value; return d; })} />
                  </div>
                </div>
                <BulletEditor
                  bullets={exp.bullets}
                  onChange={(bullets) => patch((d) => { d.experience[i].bullets = bullets; return d; })}
                />
              </EntryCard>
            ))}
          </Section>

          {/* Education */}
          <Section title="Education" onAdd={() => patch((d) => ({ ...d, education: [...d.education, emptyEducation()] }))}>
            {data.education.map((ed, i) => (
              <EntryCard key={i} onRemove={() => patch((d) => { d.education.splice(i, 1); return d; })}>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input placeholder="School" value={ed.school} onChange={(e) => patch((d) => { d.education[i].school = e.target.value; return d; })} />
                  <Input placeholder="Degree" value={ed.degree} onChange={(e) => patch((d) => { d.education[i].degree = e.target.value; return d; })} />
                  <Input placeholder="Field of study" value={ed.field} onChange={(e) => patch((d) => { d.education[i].field = e.target.value; return d; })} />
                  <Input placeholder="Location" value={ed.location} onChange={(e) => patch((d) => { d.education[i].location = e.target.value; return d; })} />
                  <Input placeholder="Start" value={ed.startDate} onChange={(e) => patch((d) => { d.education[i].startDate = e.target.value; return d; })} />
                  <Input placeholder="End" value={ed.endDate} onChange={(e) => patch((d) => { d.education[i].endDate = e.target.value; return d; })} />
                </div>
              </EntryCard>
            ))}
          </Section>

          {/* Skills */}
          <Section title="Skills">
            <SkillsEditor skills={data.skills} onChange={(skills) => patch((d) => ({ ...d, skills }))} />
          </Section>

          {/* Projects */}
          <Section title="Projects" onAdd={() => patch((d) => ({ ...d, projects: [...d.projects, emptyProject()] }))}>
            {data.projects.map((p, i) => (
              <EntryCard key={i} onRemove={() => patch((d) => { d.projects.splice(i, 1); return d; })}>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input placeholder="Name" value={p.name} onChange={(e) => patch((d) => { d.projects[i].name = e.target.value; return d; })} />
                  <Input placeholder="Link" value={p.link} onChange={(e) => patch((d) => { d.projects[i].link = e.target.value; return d; })} />
                </div>
                <Textarea className="mt-3" rows={2} placeholder="Short description" value={p.description} onChange={(e) => patch((d) => { d.projects[i].description = e.target.value; return d; })} />
                <BulletEditor bullets={p.bullets} onChange={(bullets) => patch((d) => { d.projects[i].bullets = bullets; return d; })} />
              </EntryCard>
            ))}
          </Section>

          {/* Certifications */}
          <Section title="Certifications" onAdd={() => patch((d) => ({ ...d, certifications: [...d.certifications, emptyCert()] }))}>
            {data.certifications.map((c, i) => (
              <EntryCard key={i} onRemove={() => patch((d) => { d.certifications.splice(i, 1); return d; })}>
                <div className="grid sm:grid-cols-3 gap-3">
                  <Input placeholder="Name" value={c.name} onChange={(e) => patch((d) => { d.certifications[i].name = e.target.value; return d; })} />
                  <Input placeholder="Issuer" value={c.issuer} onChange={(e) => patch((d) => { d.certifications[i].issuer = e.target.value; return d; })} />
                  <Input placeholder="Date" value={c.date} onChange={(e) => patch((d) => { d.certifications[i].date = e.target.value; return d; })} />
                </div>
              </EntryCard>
            ))}
          </Section>
        </div>

        {/* ---- Live preview ---- */}
        <div className="lg:sticky lg:top-6 self-start">
          <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800/50 p-3 overflow-auto max-h-[85vh]">
            <ResumeRenderer data={data} template={template} />
          </div>
        </div>
      </div>

      {/* ---- ATS match: paste a JD, score the live resume, iterate, re-score ---- */}
      <div className="mt-6 space-y-4">
        <GlassCard className="p-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Target job description
          </label>
          <Textarea
            rows={5}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description to score this resume against it and surface missing keywords."
          />
        </GlassCard>
        <AtsAnalysis resumeText={renderResumeText(data)} jobDescription={jobDescription} />
      </div>
    </div>
  );
}

function Section({ title, children, onAdd }: { title: string; children: React.ReactNode; onAdd?: () => void }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        {onAdd && <Button type="button" variant="secondary" size="sm" onClick={onAdd}>+ Add</Button>}
      </div>
      <div className="space-y-3">{children}</div>
    </GlassCard>
  );
}

function EntryCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-3 relative">
      <button type="button" onClick={onRemove} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm" aria-label="Remove">✕</button>
      {children}
    </div>
  );
}

function BulletEditor({ bullets, onChange }: { bullets: string[]; onChange: (b: string[]) => void }) {
  return (
    <div className="mt-3 space-y-2">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">Bullet points</label>
      {bullets.map((b, i) => (
        <div key={i} className="flex gap-2">
          <Input placeholder="Achievement / responsibility" value={b} onChange={(e) => { const next = [...bullets]; next[i] = e.target.value; onChange(next); }} />
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(bullets.filter((_, j) => j !== i))}>✕</Button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...bullets, ""])}>+ Add bullet</Button>
    </div>
  );
}

function SkillsEditor({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [input, setInput] = useState("");
  function add() {
    const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...skills, ...parts]);
    setInput("");
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {skills.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm">
            {s}
            <button type="button" onClick={() => onChange(skills.filter((_, j) => j !== i))} className="hover:text-red-500">✕</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Type a skill and press Enter (or comma-separate several)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <Button type="button" variant="secondary" size="sm" onClick={add}>Add</Button>
      </div>
    </div>
  );
}
