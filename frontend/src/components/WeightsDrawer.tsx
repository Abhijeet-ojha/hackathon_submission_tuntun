import React, { useState } from "react";
import { Sliders, RotateCcw, X, Check, Zap, Award, BookOpen, Layers, Cpu, ShieldCheck } from "lucide-react";
import type { ScoringWeights } from "../types";

interface WeightsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  weights: ScoringWeights;
  rankingMode?: "deterministic" | "learned" | "hybrid";
  alpha?: number;
  onApplyWeights: (weights: ScoringWeights, mode?: "deterministic" | "learned" | "hybrid", alpha?: number) => void;
}

export const WeightsDrawer: React.FC<WeightsDrawerProps> = ({
  isOpen,
  onClose,
  weights,
  rankingMode = "hybrid",
  alpha = 0.75,
  onApplyWeights,
}) => {
  const [localWeights, setLocalWeights] = useState<ScoringWeights>({ ...weights });
  const [localMode, setLocalMode] = useState<"deterministic" | "learned" | "hybrid">(rankingMode);
  const [localAlpha, setLocalAlpha] = useState<number>(alpha);

  if (!isOpen) return null;

  const handleSliderChange = (key: keyof ScoringWeights, val: number) => {
    setLocalWeights((prev) => ({
      ...prev,
      [key]: val / 100,
    }));
  };

  const applyPreset = (presetName: string) => {
    if (presetName === "default") {
      setLocalWeights({
        semantic: 0.25,
        keyword: 0.25,
        required_coverage: 0.20,
        preferred_coverage: 0.10,
        evidence_strength: 0.10,
        experience_relevance: 0.05,
        education_fit: 0.05,
      });
      setLocalMode("hybrid");
      setLocalAlpha(0.75);
    } else if (presetName === "must_have_strict") {
      setLocalWeights({
        semantic: 0.10,
        keyword: 0.20,
        required_coverage: 0.45,
        preferred_coverage: 0.05,
        evidence_strength: 0.15,
        experience_relevance: 0.05,
        education_fit: 0.00,
      });
      setLocalMode("deterministic");
      setLocalAlpha(1.0);
    } else if (presetName === "evidence_focus") {
      setLocalWeights({
        semantic: 0.20,
        keyword: 0.20,
        required_coverage: 0.20,
        preferred_coverage: 0.05,
        evidence_strength: 0.30,
        experience_relevance: 0.05,
        education_fit: 0.00,
      });
      setLocalMode("hybrid");
      setLocalAlpha(0.60);
    } else if (presetName === "ml_heavy") {
      setLocalWeights({
        semantic: 0.25,
        keyword: 0.25,
        required_coverage: 0.20,
        preferred_coverage: 0.10,
        evidence_strength: 0.10,
        experience_relevance: 0.05,
        education_fit: 0.05,
      });
      setLocalMode("learned");
      setLocalAlpha(0.0);
    }
  };

  const handleSave = () => {
    onApplyWeights(localWeights, localMode, localAlpha);
    onClose();
  };

  const weightFields: Array<{
    key: keyof ScoringWeights;
    label: string;
    desc: string;
    icon: any;
    color: string;
  }> = [
    {
      key: "semantic",
      label: "Semantic Relevance",
      desc: "MiniLM cosine similarity between JD responsibilities and candidate projects/sections.",
      icon: Zap,
      color: "text-primary",
    },
    {
      key: "keyword",
      label: "Explicit Skill & Keyword Match",
      desc: "Ontology-normalized and fuzzy phrase matches across tech stack.",
      icon: Layers,
      color: "text-primary",
    },
    {
      key: "required_coverage",
      label: "Required (Must-Have) Skill Coverage",
      desc: "% of mandatory skills matched (direct or transferable).",
      icon: Check,
      color: "text-[#1b8a3b]",
    },
    {
      key: "preferred_coverage",
      label: "Preferred Skill Coverage",
      desc: "% of should-have and nice-to-have skills matched.",
      icon: Award,
      color: "text-primary",
    },
    {
      key: "evidence_strength",
      label: "Evidence Tier Strength (0–3)",
      desc: "Scores depth of project demonstration and measurable quantified metrics.",
      icon: Award,
      color: "text-tertiary",
    },
    {
      key: "experience_relevance",
      label: "Project & Experience Depth",
      desc: "Semantic alignment of candidate's project descriptions to role domain.",
      icon: BookOpen,
      color: "text-primary",
    },
    {
      key: "education_fit",
      label: "Education & Degree Fit",
      desc: "Rule-based alignment with academic degree and major requirements.",
      icon: BookOpen,
      color: "text-secondary",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#2d2d2d]/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#fcf9f8] border-l-2 border-[#2d2d2d] shadow-2xl h-full flex flex-col p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#2d2d2d]">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            <h3 className="font-['Kalam'] text-xl font-bold text-[#1b1c1c]">
              Formula & ML Tuner
            </h3>
          </div>
          <button
            onClick={onClose}
            className="paper-btn p-1.5 rounded-lg border-2 border-[#2d2d2d] bg-white text-[#2d2d2d] hover:bg-secondary hover:text-white shadow-[2px_2px_0px_#2d2d2d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets */}
        <div className="my-4">
          <label className="font-['Kalam'] text-xs font-bold text-[#737782] uppercase tracking-wider block mb-2">
            Preset Archetypes
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => applyPreset("default")}
              className="paper-btn px-2.5 py-1.5 text-xs font-['Karla'] font-bold rounded-lg bg-white hover:bg-[#eae7e7] text-[#1b1c1c] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] text-left truncate cursor-pointer"
            >
              Hybrid Default (75/25)
            </button>
            <button
              type="button"
              onClick={() => applyPreset("must_have_strict")}
              className="paper-btn px-2.5 py-1.5 text-xs font-['Karla'] font-bold rounded-lg bg-white hover:bg-[#eae7e7] text-[#1b1c1c] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] text-left truncate cursor-pointer"
            >
              100% Rules Strict
            </button>
            <button
              type="button"
              onClick={() => applyPreset("evidence_focus")}
              className="paper-btn px-2.5 py-1.5 text-xs font-['Karla'] font-bold rounded-lg bg-white hover:bg-[#eae7e7] text-[#1b1c1c] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] text-left truncate cursor-pointer"
            >
              Evidence Heavy (60/40)
            </button>
            <button
              type="button"
              onClick={() => applyPreset("ml_heavy")}
              className="paper-btn px-2.5 py-1.5 text-xs font-['Karla'] font-bold rounded-lg bg-white hover:bg-[#eae7e7] text-[#1b1c1c] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] text-left truncate cursor-pointer"
            >
              100% Learned ML
            </button>
          </div>
        </div>

        {/* ML Hybrid Blending Alpha Slider */}
        <div className="mb-4 p-3.5 bg-[#d6e3ff]/40 rounded-xl border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d]">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-primary" />
              <span className="font-['Karla'] text-xs font-bold text-[#1b1c1c]">
                Hybrid Blending Ratio (α)
              </span>
            </div>
            <span className="text-xs font-bold font-mono text-primary bg-white px-2 py-0.5 rounded border border-[#2d2d2d]">
              {Math.round(localAlpha * 100)}% Det / {Math.round((1 - localAlpha) * 100)}% ML
            </span>
          </div>
          <p className="text-[11px] text-[#424750] font-['Karla'] mb-2 leading-tight">
            Blends deterministic scoring with the learned pairwise ML ranker weights:
            <span className="font-mono block text-[10px] text-primary font-bold mt-0.5">
              Final = α·Deterministic + (1-α)·Learned ML
            </span>
          </p>

          <div className="grid grid-cols-3 gap-1.5 mb-2.5">
            <button
              type="button"
              onClick={() => {
                setLocalMode("deterministic");
                setLocalAlpha(1.0);
              }}
              className={`px-2 py-1 text-[11px] font-bold rounded border transition-all cursor-pointer ${
                localAlpha === 1.0
                  ? "bg-primary text-white border-[#2d2d2d] shadow-[1px_1px_0px_#2d2d2d]"
                  : "bg-white text-[#1b1c1c] border-[#2d2d2d]/40 hover:bg-[#f0eded]"
              }`}
            >
              100% Rules
            </button>
            <button
              type="button"
              onClick={() => {
                setLocalMode("hybrid");
                setLocalAlpha(0.75);
              }}
              className={`px-2 py-1 text-[11px] font-bold rounded border transition-all cursor-pointer ${
                localAlpha > 0.0 && localAlpha < 1.0
                  ? "bg-primary text-white border-[#2d2d2d] shadow-[1px_1px_0px_#2d2d2d]"
                  : "bg-white text-[#1b1c1c] border-[#2d2d2d]/40 hover:bg-[#f0eded]"
              }`}
            >
              Hybrid (75/25)
            </button>
            <button
              type="button"
              onClick={() => {
                setLocalMode("learned");
                setLocalAlpha(0.0);
              }}
              className={`px-2 py-1 text-[11px] font-bold rounded border transition-all cursor-pointer ${
                localAlpha === 0.0
                  ? "bg-primary text-white border-[#2d2d2d] shadow-[1px_1px_0px_#2d2d2d]"
                  : "bg-white text-[#1b1c1c] border-[#2d2d2d]/40 hover:bg-[#f0eded]"
              }`}
            >
              100% ML
            </button>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={Math.round(localAlpha * 100)}
            onChange={(e) => {
              const val = parseFloat(e.target.value) / 100;
              setLocalAlpha(val);
              if (val === 1.0) setLocalMode("deterministic");
              else if (val === 0.0) setLocalMode("learned");
              else setLocalMode("hybrid");
            }}
            className="w-full accent-primary h-1.5 bg-white border border-[#2d2d2d] rounded-lg cursor-pointer"
          />
        </div>

        {/* Sliders list */}
        <div className="space-y-3.5 flex-1 my-2">
          {weightFields.map((field) => {
            const Icon = field.icon;
            const currentVal = Math.round(localWeights[field.key] * 100);
            return (
              <div key={field.key} className="bg-white p-3.5 rounded-xl border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 ${field.color}`} />
                    <span className="font-['Karla'] text-xs font-bold text-[#1b1c1c]">
                      {field.label}
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono text-primary bg-[#d6e3ff] px-2 py-0.5 rounded border border-[#2d2d2d]">
                    {currentVal}%
                  </span>
                </div>
                <p className="text-[11px] text-[#737782] font-['Karla'] mb-2.5 leading-relaxed">
                  {field.desc}
                </p>
                <input
                  type="range"
                  min="0"
                  max="70"
                  step="5"
                  value={currentVal}
                  onChange={(e) =>
                    handleSliderChange(field.key, parseFloat(e.target.value))
                  }
                  className="w-full accent-primary h-1.5 bg-[#f0eded] border border-[#2d2d2d] rounded-lg cursor-pointer"
                />
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t-2 border-[#2d2d2d] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => applyPreset("default")}
            className="paper-btn flex items-center gap-1.5 px-3 py-2 text-xs font-['Karla'] font-bold rounded-lg bg-[#f0eded] hover:bg-[#eae7e7] text-[#1b1c1c] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="paper-btn btn-red-action flex-1 py-2.5 rounded-lg text-xs font-['Kalam'] font-bold text-white bg-[#ff4d4d] hover:bg-[#ff3333] border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4 text-white" />
            <span className="text-white">Apply & Recalculate Ranks</span>
          </button>
        </div>
      </div>
    </div>
  );
};
