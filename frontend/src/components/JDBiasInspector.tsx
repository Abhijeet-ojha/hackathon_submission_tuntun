import React, { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import type { JDIntelligence, FlaggedRequirement } from "../types";
import { checkJDBias } from "../services/api";

interface JDBiasInspectorProps {
  jd: JDIntelligence | null;
}

export const JDBiasInspector: React.FC<JDBiasInspectorProps> = ({ jd }) => {
  const [testJDText, setTestJDText] = useState("");
  const [flags, setFlags] = useState<FlaggedRequirement[]>(
    jd?.flagged_requirements || []
  );
  const [isChecking, setIsChecking] = useState(false);

  const handleTestBiasedJD = () => {
    const biasedSample = `Job Title: Junior Full-Stack Developer Intern (Rockstar Ninja Wanted)

We are seeking a ninja software developer who can work under extreme 24/7 pressure.
Must-Have Requirements:
- 5+ years of production experience in React 18 strictly.
- Top-tier Tier-1 Ivy League university degree only.
- 4+ years architecting enterprise distributed microservices.`;

    setTestJDText(biasedSample);
    setIsChecking(true);
    checkJDBias(biasedSample, "Junior Full Stack Developer Intern")
      .then((res) => {
        setFlags(res.flagged_requirements);
        setIsChecking(false);
      })
      .catch(() => setIsChecking(false));
  };

  const handleCustomCheck = () => {
    if (!testJDText.trim()) return;
    setIsChecking(true);
    checkJDBias(testJDText)
      .then((res) => {
        setFlags(res.flagged_requirements);
        setIsChecking(false);
      })
      .catch(() => setIsChecking(false));
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-6 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-secondary">
          <ShieldAlert className="w-5 h-5 text-secondary" />
          <h3 className="font-['Kalam'] text-xl font-bold text-[#1b1c1c]">
            Job Description Bias & Quality Inspector
          </h3>
        </div>
        <p className="text-xs text-[#424750] font-['Karla'] leading-relaxed max-w-3xl">
          Rule-based heuristic detector that flags unrealistic tenure pins, restrictive version constraints, exclusionary buzzwords, and pedigree bias in your job descriptions. Flags only — never modifies the JD without recruiter review.
        </p>
      </div>

      {/* Current Active JD Flags */}
      <div className="bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[#2d2d2d]/30">
          <h4 className="font-['Kalam'] text-base font-bold text-[#1b1c1c] flex items-center gap-2">
            <span>Active JD Analysis:</span>
            <span className="text-primary">{jd?.role_title || "Junior Full Stack Developer Intern"}</span>
          </h4>
          <span className="font-['Kalam'] text-xs font-bold text-secondary bg-[#ffdad7] px-2.5 py-0.5 rounded border border-[#2d2d2d]">
            {flags.length} Flagged Warnings
          </span>
        </div>

        {flags.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#eaf8ee] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] text-xs font-['Karla'] text-[#1b8a3b] font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1b8a3b] shrink-0" />
            <span>
              Clean JD! No excessive tenure pins, exclusionary buzzwords, or rigid version constraints detected.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flags.map((flag, idx) => (
              <div
                key={idx}
                className="relative bg-[#fff9c4] border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-4 rounded-xl rotate-[-0.5deg] hover:rotate-0 transition-transform space-y-2"
              >
                {/* Red Thumbtack */}
                <div className="absolute -top-3 right-6 w-5 h-5 rounded-full bg-secondary border-2 border-[#2d2d2d] shadow-[1px_1px_0px_#2d2d2d] flex items-center justify-center pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80 block"></span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-secondary shrink-0" />
                    <span className="font-['Kalam'] font-bold text-sm text-[#1b1c1c]">
                      Flagged: "{flag.requirement}"
                    </span>
                  </div>
                  <span className="text-[10px] font-['Karla'] font-bold uppercase px-2 py-0.5 rounded bg-white border border-[#2d2d2d]">
                    {flag.severity}
                  </span>
                </div>

                <p className="text-[#424750] text-xs font-['Karla'] leading-snug">
                  <span className="font-bold text-[#1b1c1c]">Reason: </span>
                  {flag.reason}
                </p>

                {flag.suggestion && (
                  <div className="p-2.5 rounded-lg bg-white border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] text-xs text-[#1b1c1c] flex items-start gap-1.5 font-['Karla']">
                    <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span>
                      <strong className="text-primary font-bold">Recommendation: </strong>
                      {flag.suggestion}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Bias Playground */}
      <div className="bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-['Kalam'] text-sm font-bold text-[#1b1c1c] uppercase tracking-wider">
            Interactive Bias Detector Test Playground
          </h4>
          <button
            type="button"
            onClick={handleTestBiasedJD}
            className="paper-btn text-xs font-['Karla'] font-bold text-secondary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-secondary" />
            <span>Load High-Bias Example JD</span>
          </button>
        </div>

        <textarea
          value={testJDText}
          onChange={(e) => setTestJDText(e.target.value)}
          placeholder="Paste or type any job description text here to test the bias & sanity detector..."
          rows={5}
          className="w-full p-3 bg-[#fcf9f8] border-2 border-[#2d2d2d] rounded-lg text-xs font-mono text-[#1b1c1c] shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#fff9c4]"
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleCustomCheck}
            disabled={isChecking || !testJDText.trim()}
            className="paper-btn btn-red-action px-5 py-2.5 rounded-lg text-xs font-['Kalam'] font-bold text-white bg-[#ff4d4d] hover:bg-[#ff3333] border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="text-white">{isChecking ? "Scanning JD..." : "Inspect Bias & Constraints"}</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
