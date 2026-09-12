import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  FileCode,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Paperclip,
  Trash2
} from "lucide-react";

interface UploadZoneProps {
  onAnalyze: (jdText: string, jdFile: File | null, resumeFiles: File[]) => void;
  onLoadSample: () => void;
  isLoading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onAnalyze,
  onLoadSample,
  isLoading,
}) => {
  const [jdText, setJdText] = useState(
    `Junior Full Stack Developer Intern at TechNova Solutions.
Requirements:
- Strong proficiency in React.js, modern JavaScript (ES6+), and HTML5/CSS3.
- Backend development experience with Node.js and Express.js RESTful APIs.
- Database modeling with MongoDB / Mongoose or PostgreSQL.
- Version control with Git and GitHub collaborative workflows.
- Curious problem-solver with interest in building responsive user interfaces.`
  );
  const [isEditingJd, setIsEditingJd] = useState(false);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);

  const defaultCriteria = [
    { name: "React", weight: "3×", active: true },
    { name: "Node.js", weight: "2×", active: true },
    { name: "JavaScript (ES6+)", weight: "1×", active: true },
    { name: "REST APIs", weight: "1×", active: true },
    { name: "MongoDB", weight: "1×", active: true },
    { name: "Git / GitHub", weight: "1×", active: true },
    { name: "Problem-solving ★", weight: "1×", active: true },
  ];

  const [criteria, setCriteria] = useState(defaultCriteria);

  const toggleCriterion = (index: number) => {
    setCriteria((prev) =>
      prev.map((c, i) => (i === index ? { ...c, active: !c.active } : c))
    );
  };

  const handleResumeFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter(
      (f) =>
        f.type === "application/pdf" ||
        f.name.endsWith(".pdf") ||
        f.name.endsWith(".docx") ||
        f.name.endsWith(".txt") ||
        f.name.endsWith(".xml") ||
        f.name.endsWith(".md")
    );
    setResumeFiles((prev) => [...prev, ...valid]);
  };

  const removeResumeFile = (index: number) => {
    setResumeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleResumeFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim() && !jdFile) {
      alert("Please enter a Job Description text or upload a JD document.");
      return;
    }
    if (resumeFiles.length === 0) {
      // If no custom uploaded files, trigger sample demo analyze
      onLoadSample();
      return;
    }
    onAnalyze(jdText, jdFile, resumeFiles);
  };

  const getInitials = (name: string) => {
    const parts = name.replace(".pdf", "").split(/[_\s-]+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full flex flex-col gap-8 mb-10">
      {/* Hero Header Section */}
      <div className="relative flex flex-col items-center text-center pt-2">
        {/* Playful Decorative Stamp Left */}
        <div className="hidden md:flex absolute left-2 top-0 flex-col items-center rotate-[-7deg] pointer-events-none select-none">
          <div className="px-3 py-1 bg-[#fff9c4] border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] [border-radius:255px_15px_225px_15px/15px_225px_15px_255px]">
            <span className="font-['Kalam'] font-bold text-xs text-primary tracking-wider uppercase">
              Offline Scoring Engine
            </span>
          </div>
        </div>

        {/* Playful Sticky Note Right */}
        <div className="hidden lg:flex absolute right-4 top-0 rotate-[6deg] pointer-events-none select-none items-center gap-1.5 px-3 py-1.5 bg-[#fff9c4] border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] [border-radius:255px_15px_225px_15px/15px_225px_15px_255px]">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary border border-[#2d2d2d] inline-block shadow-[1px_1px_0px_#2d2d2d]"></span>
          <span className="font-['Kalam'] font-bold text-xs text-[#2d2d2d]">
            Strictly explainable
          </span>
        </div>

        {/* Main Headline */}
        <div className="relative inline-block">
          <h1 className="font-['Kalam'] font-bold text-3xl sm:text-4xl md:text-5xl text-[#2d2d2d] leading-tight tracking-tight">
            Find the right people, without the pile.
            <span className="inline-block origin-bottom-right rotate-[12deg] text-secondary hover:rotate-[24deg] transition-transform cursor-pointer">
              !
            </span>
          </h1>
          {/* Hand-drawn squiggle underline SVG */}
          <svg
            className="w-full h-4 mt-1 text-secondary overflow-visible"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 500 16"
          >
            <path
              d="M3,11 Q 60,3 125,12 T 250,10 T 375,13 T 497,8"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="3.5"
            />
          </svg>
        </div>

        {/* Subtitle */}
        <p className="font-['Karla'] text-base sm:text-lg text-[#424750] max-w-2xl mt-3 font-medium leading-relaxed">
          Compares semantic meaning <span className="text-primary font-bold">+</span> explicit candidate skills to build a fair, explainable shortlist in seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8">
        {/* 2-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN: The Role ================= */}
          <section className="lg:col-span-6 flex flex-col relative">
            {/* Masking Tape Top Accents */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#f0e8d0]/90 border border-[#2d2d2d]/20 rotate-[-1.5deg] z-20 pointer-events-none shadow-[0_1px_1px_rgba(0,0,0,0.1)]"></div>
            <div className="absolute -top-3.5 left-10 z-20">
              <div className="px-3.5 py-1 bg-[#fff9c4] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] rotate-[-2.5deg] [border-radius:255px_15px_225px_15px/15px_225px_15px_255px]">
                <span className="font-['Kalam'] font-bold text-sm text-[#2d2d2d] tracking-wide">
                  01. The role
                </span>
              </div>
            </div>

            {/* Main Card Envelope */}
            <div className="bg-[#ffffff] border-2 border-[#2d2d2d] shadow-[5px_5px_0px_#2d2d2d] pt-8 pb-6 px-4 sm:px-6 [border-radius:255px_15px_225px_15px/15px_225px_15px_255px] relative mt-2 flex flex-col gap-4">
              {/* Card Header Action Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-dashed border-[#e4e2e1]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    description
                  </span>
                  <h2 className="font-['Kalam'] font-bold text-xl text-[#2d2d2d]">
                    Job description & criteria
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={jdInputRef}
                    accept=".txt,.pdf,.md"
                    onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingJd(!isEditingJd)}
                    className="paper-btn inline-flex items-center gap-1 px-2.5 py-1 bg-[#f6f3f2] hover:bg-[#eae7e7] text-[#2d2d2d] font-['Karla'] font-bold text-xs border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] rounded cursor-pointer"
                  >
                    {isEditingJd ? "Preview Pad" : "Edit Raw Text"}
                  </button>
                  <button
                    type="button"
                    onClick={() => jdInputRef.current?.click()}
                    className="paper-btn inline-flex items-center gap-1 px-2.5 py-1 bg-[#f6f3f2] hover:bg-[#eae7e7] text-[#2d2d2d] font-['Karla'] font-bold text-xs border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] rounded cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Upload JD</span>
                  </button>
                </div>
              </div>

              {/* Structured Job Spec Textbox */}
              {isEditingJd ? (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#737782] font-['Karla']">
                    RAW JOB DESCRIPTION (MARKDOWN / TEXT)
                  </label>
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    rows={8}
                    className="w-full p-3 bg-[#fdfbf7] border-2 border-[#2d2d2d] rounded-lg text-xs font-mono text-[#2d2d2d] focus:outline-none focus:ring-2 focus:ring-[#fff9c4] shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]"
                    placeholder="Paste job description text here..."
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-['Karla'] text-[#737782] font-bold">
                    <span>ACTIVE PROFILE TARGET</span>
                    <span className="text-primary">Live Semantic Parsing Active</span>
                  </div>
                  <div className="relative bg-[#fdfbf7] border-2 border-[#2d2d2d] [border-radius:15px_255px_15px_225px/225px_15px_255px_15px] p-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]">
                    <div className="flex flex-col gap-2 text-[#2d2d2d]">
                      <div className="flex items-baseline gap-2 pb-1 border-b border-[#e4e2e1]">
                        <span className="font-['Kalam'] font-bold text-sm text-primary">
                          Role:
                        </span>
                        <span className="font-['Karla'] font-bold text-base text-[#2d2d2d]">
                          Junior Full Stack Developer Intern
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 pb-1 border-b border-[#e4e2e1]">
                        <span className="font-['Kalam'] font-bold text-sm text-primary">
                          Company:
                        </span>
                        <span className="font-['Karla'] font-medium text-sm text-[#424750]">
                          TechNova Solutions
                        </span>
                      </div>
                      <div>
                        <span className="font-['Kalam'] font-bold text-sm text-primary">
                          Summary:
                        </span>
                        <p className="font-['Karla'] text-xs sm:text-sm leading-relaxed text-[#424750] mt-0.5">
                          Looking for a curious junior developer who loves building user interfaces and RESTful APIs. You'll collaborate on core web platforms using React, Node, and databases with CI/CD and clean code practices.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Extracted Requirements Tag Cloud */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-['Kalam'] font-bold text-sm text-[#2d2d2d] flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-secondary">
                      auto_awesome
                    </span>
                    Extracted Criteria Chips ({criteria.length} anchors)
                  </span>
                  <span className="font-['Karla'] text-xs text-[#737782] italic">
                    Click to toggle weight
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {criteria.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleCriterion(i)}
                      className={`paper-btn px-3 py-1 font-['Karla'] font-bold text-xs border-2 border-[#2d2d2d] rounded-full transition-transform flex items-center gap-1 cursor-pointer ${
                        c.active
                          ? i < 2
                            ? "bg-primary-container text-white shadow-[2px_2px_0px_#2d2d2d] rotate-[-1deg]"
                            : i === 6
                            ? "bg-[#fff9c4] text-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] rotate-[-2deg]"
                            : "bg-[#e5e0d8] hover:bg-[#fff9c4] text-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] rotate-[1deg]"
                          : "bg-gray-200 text-gray-400 line-through opacity-60"
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className="text-[10px] opacity-80 font-normal">
                        {c.weight}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recruiter Tip Callout Note */}
              <div className="p-3 bg-[#eaf1fb] border-2 border-[#2d2d2d] [border-radius:255px_15px_225px_15px/15px_225px_15px_255px] shadow-[3px_3px_0px_#2d2d2d] relative flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">
                  edit_note
                </span>
                <p className="font-['Karla'] text-xs text-primary leading-snug font-medium">
                  <span className="font-['Kalam'] font-bold text-primary text-sm">
                    Recruiter Tip:{" "}
                  </span>
                  We weigh exact skills + transferable experience (e.g. Express/FastAPI, Vue/React) so untraditional talent isn't lost in keyword filters.
                </p>
              </div>
            </div>
          </section>

          {/* ================= RIGHT COLUMN: The Candidates ================= */}
          <section className="lg:col-span-6 flex flex-col relative">
            {/* Masking Tape Top Accents */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#f0e8d0]/90 border border-[#2d2d2d]/20 rotate-[1.5deg] z-20 pointer-events-none shadow-[0_1px_1px_rgba(0,0,0,0.1)]"></div>
            <div className="absolute -top-3.5 left-10 z-20">
              <div className="px-3.5 py-1 bg-[#fff9c4] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] rotate-[2deg] [border-radius:255px_15px_225px_15px/15px_225px_15px_255px]">
                <span className="font-['Kalam'] font-bold text-sm text-[#2d2d2d] tracking-wide">
                  02. The candidates
                </span>
              </div>
            </div>

            {/* Main Card Envelope */}
            <div className="bg-[#ffffff] border-2 border-[#2d2d2d] shadow-[5px_5px_0px_#2d2d2d] pt-8 pb-6 px-4 sm:px-6 [border-radius:15px_255px_15px_225px/225px_15px_255px_15px] relative mt-2 flex flex-col gap-4">
              {/* Drop & Upload Zone Container */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => resumeInputRef.current?.click()}
                className={`relative group cursor-pointer border-2 border-dashed border-[#2d2d2d] p-5 text-center [border-radius:255px_15px_225px_15px/15px_225px_15px_255px] transition-colors ${
                  dragActive ? "bg-[#fff9c4]/40" : "bg-[#fdfbf7] hover:bg-[#fffdf2]"
                }`}
              >
                <input
                  type="file"
                  ref={resumeInputRef}
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.xml,.md"
                  onChange={(e) => handleResumeFiles(e.target.files)}
                  className="hidden"
                />


                {/* Subtle Red Thumbtack */}
                <div className="absolute -top-2.5 right-6 w-5 h-5 rounded-full bg-secondary border-2 border-[#2d2d2d] shadow-[1px_1px_0px_#2d2d2d] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70 block"></span>
                </div>

                {/* Sketch Document Stack Graphic */}
                <div className="flex justify-center mb-2">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute w-9 h-11 bg-[#e5e0d8] border-2 border-[#2d2d2d] rotate-[-8deg] rounded-sm"></div>
                    <div className="absolute w-9 h-11 bg-[#fff9c4] border-2 border-[#2d2d2d] rotate-[4deg] rounded-sm"></div>
                    <div className="absolute w-9 h-11 bg-white border-2 border-[#2d2d2d] rounded-sm flex items-center justify-center shadow-[2px_2px_0px_#2d2d2d]">
                      <span className="material-symbols-outlined text-primary text-xl">
                        file_upload
                      </span>
                    </div>
                  </div>
                </div>

                <p className="font-['Kalam'] font-bold text-lg text-[#2d2d2d]">
                  Drop resume PDFs here
                </p>
                <p className="font-['Karla'] text-xs sm:text-sm text-[#737782] font-semibold mt-0.5">
                  or{" "}
                  <span className="text-primary underline decoration-wavy underline-offset-4">
                    browse files
                  </span>{" "}
                  from your computer
                </p>

                {/* Staged Batch Badge */}
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-[#eaf8ee] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] rounded-full rotate-[-1deg]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1b8a3b]" />
                  <span className="font-['Karla'] font-bold text-xs text-[#1b8a3b]">
                    {resumeFiles.length > 0
                      ? `${resumeFiles.length} custom resume(s) staged`
                      : "Ready to load 16 verified demo candidate PDFs"}
                  </span>
                </div>
              </div>

              {/* Staged Candidate File Queue List */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="font-['Kalam'] font-bold text-xs sm:text-sm text-[#2d2d2d] uppercase tracking-wide">
                    {resumeFiles.length > 0
                      ? `Staged Batch (${resumeFiles.length} PDFs)`
                      : "Sample Batch Preview (16 Resumes Ready)"}
                  </span>
                  {resumeFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setResumeFiles([])}
                      className="font-['Karla'] font-bold text-xs text-secondary hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear all
                    </button>
                  )}
                </div>

                {/* Candidate Rows Container */}
                <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {resumeFiles.length > 0 ? (
                    resumeFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 bg-[#fdfbf7] hover:bg-[#fff9c4]/30 border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] rounded transition-transform hover:-translate-y-0.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded bg-primary text-white flex items-center justify-center font-['Kalam'] font-bold text-xs shrink-0 border border-[#2d2d2d]">
                            {getInitials(file.name)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-['Karla'] font-bold text-xs text-[#2d2d2d] truncate">
                              {file.name}
                            </span>
                            <span className="font-['Karla'] text-[11px] text-[#737782]">
                              {(file.size / 1024).toFixed(0)} KB • Custom PDF
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeResumeFile(i)}
                          className="text-[#737782] hover:text-secondary p-1 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    // Default preview files when none uploaded yet
                    [
                      { name: "Aditi_Sharma_Resume.pdf", tag: "142 KB • Full-Stack React + Node", color: "bg-primary" },
                      { name: "Rohan_Mehta_CV_2025.pdf", tag: "188 KB • Express & PostgreSQL", color: "bg-secondary" },
                      { name: "Priya_Nair_FullStack.pdf", tag: "210 KB • Node, Git & REST APIs", color: "bg-tertiary" },
                      { name: "Arjun_Kapoor_Software.pdf", tag: "165 KB • Frontend React Focus", color: "bg-primary" },
                    ].map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 bg-[#fdfbf7] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] rounded"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded ${f.color} text-white flex items-center justify-center font-['Kalam'] font-bold text-xs shrink-0 border border-[#2d2d2d]`}>
                            {getInitials(f.name)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-['Karla'] font-bold text-xs text-[#2d2d2d] truncate">
                              {f.name}
                            </span>
                            <span className="font-['Karla'] text-[11px] text-[#737782]">
                              {f.tag}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-['Kalam'] text-primary font-bold">
                          Ready in Demo
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Sticky Note on Candidates Column */}
              <div className="p-2.5 bg-[#fff9c4] border-2 border-[#2d2d2d] [border-radius:255px_15px_225px_15px/15px_225px_15px_255px] shadow-[3px_3px_0px_#2d2d2d] rotate-[-0.8deg] flex items-center gap-2">
                <span className="text-base">📌</span>
                <span className="font-['Karla'] font-bold text-xs text-[#2d2d2d]">
                  Note: 15–18 resumes works best for demo matrix accuracy and comparative ablation proof.
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Action Area */}
        <footer className="pt-4 flex flex-col gap-4 relative">
          {/* Hand-drawn dashed pencil divider */}
          <div className="w-full flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#2d2d2d] shrink-0"></span>
            <div className="w-full border-t-2 border-dashed border-[#2d2d2d]"></div>
            <span className="w-3 h-3 rounded-full bg-[#2d2d2d] shrink-0"></span>
          </div>

          {/* Action Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            {/* Summary State */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#fdfbf7] border-2 border-[#2d2d2d] flex items-center justify-center shadow-[2px_2px_0px_#2d2d2d] -rotate-3 shrink-0">
                <span className="material-symbols-outlined text-primary text-xl">
                  inventory_2
                </span>
              </div>
              <div>
                <p className="font-['Kalam'] font-bold text-base sm:text-lg text-[#2d2d2d] leading-tight">
                  1 job description + {resumeFiles.length > 0 ? resumeFiles.length : 16} resumes ready to analyze
                </p>
                <p className="font-['Karla'] text-xs text-[#737782] font-semibold">
                  Weights mapped • Hybrid token scoring prepared • Zero hallucination guardrails
                </p>
              </div>
            </div>

            {/* Primary CTA with Sketchy Pointer */}
            <div className="flex flex-col items-center sm:items-end gap-1.5 w-full sm:w-auto">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {/* Sketchy Arrow SVG pointing at the CTA */}
                <div className="hidden md:flex flex-col items-end rotate-[-4deg] -mr-1 pointer-events-none">
                  <span className="font-['Kalam'] text-xs text-secondary font-bold">
                    One-click ranking
                  </span>
                  <svg className="w-12 h-6 text-secondary" fill="none" viewBox="0 0 50 25">
                    <path
                      d="M5,12 Q 22,2 38,13"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M30,7 L39,14 L31,20"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>

                {/* Big Hand-drawn Red Action Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="paper-btn btn-red-lg w-full sm:w-auto px-8 py-3.5 bg-[#ff4d4d] hover:bg-[#ff3333] text-white font-['Kalam'] font-bold text-xl border-2 border-[#2d2d2d] shadow-[5px_5px_0px_#2d2d2d] [border-radius:255px_15px_225px_15px/15px_225px_15px_255px] rotate-[-1deg] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-2xl text-white">
                        sync
                      </span>
                      <span className="text-white">Weighing rubrics...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-white">Rank candidates</span>
                      <ArrowRight className="w-6 h-6 text-white" />
                    </>
                  )}
                </button>
              </div>

              {/* Trust Subtext */}
              <div className="flex items-center gap-1.5 text-center sm:text-right">
                <span className="material-symbols-outlined text-xs text-primary">
                  lock
                </span>
                <p className="font-['Karla'] text-xs text-[#424750] font-medium">
                  Semantic context + exact keyword evidence — zero black-box scoring
                </p>
              </div>
            </div>
          </div>
        </footer>
      </form>
    </div>
  );
};
