import React from "react";
import {
  HelpCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  BarChart3,
} from "lucide-react";

export const HowItWorksExplainer: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-6 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h3 className="font-['Kalam'] text-xl font-bold text-[#1b1c1c]">
            Architecture & Scoring Methodology
          </h3>
        </div>
        <p className="text-xs text-[#424750] font-['Karla'] leading-relaxed max-w-3xl">
          InternLoom is an evidence-driven hybrid candidate intelligence engine that combines semantic embeddings, ontology normalization, explicit skill matching, contextual evidence tiers, and transparent ranking to help recruiters make faster, defensible decisions.
        </p>
      </div>

      {/* 4 Evidence Tiers */}
      <div className="bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-6 rounded-xl space-y-4">
        <h4 className="font-['Kalam'] text-sm font-bold text-[#1b1c1c] uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-secondary" />
          Contextual Evidence Tiers (0–3)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#f0eded] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] space-y-1.5">
            <span className="px-2 py-0.5 text-[10px] font-bold font-['Karla'] bg-white border border-[#2d2d2d] text-[#737782] rounded">
              Tier 0: Absent
            </span>
            <h5 className="font-['Kalam'] text-sm font-bold text-[#1b1c1c]">Skill Not Found</h5>
            <p className="text-[11px] text-[#424750] font-['Karla'] leading-relaxed">
              No direct, alias, or transferable match found anywhere in the resume sections.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#fff9c4] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] space-y-1.5">
            <span className="px-2 py-0.5 text-[10px] font-bold font-['Karla'] bg-white border border-[#2d2d2d] text-[#1b1c1c] rounded">
              Tier 1: Mentioned
            </span>
            <h5 className="font-['Kalam'] text-sm font-bold text-[#1b1c1c]">Keyword Enumeration</h5>
            <p className="text-[11px] text-[#424750] font-['Karla'] leading-relaxed">
              Listed in a skills header or bullet with no active project implementation context.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#d6e3ff] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] space-y-1.5">
            <span className="px-2 py-0.5 text-[10px] font-bold font-['Karla'] bg-white border border-[#2d2d2d] text-primary rounded">
              Tier 2: Demonstrated
            </span>
            <h5 className="font-['Kalam'] text-sm font-bold text-[#1b1c1c]">Hands-on Project</h5>
            <p className="text-[11px] text-[#424750] font-['Karla'] leading-relaxed">
              Found in projects or experience with active action verbs (e.g. built, engineered, deployed).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#eaf8ee] border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] space-y-1.5">
            <span className="px-2 py-0.5 text-[10px] font-bold font-['Karla'] bg-white border border-[#2d2d2d] text-[#1b8a3b] rounded flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-[#1b8a3b]" />
              Tier 3: Measurable Impact
            </span>
            <h5 className="font-['Kalam'] text-sm font-bold text-[#1b1c1c]">Quantified Outcomes</h5>
            <p className="text-[11px] text-[#424750] font-['Karla'] leading-relaxed">
              Demonstrated with concrete numerical metrics (e.g. "reduced latency by 40%", "15k req/s").
            </p>
          </div>
        </div>
      </div>

      {/* 7 Factor Scoring Formula */}
      <div className="bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-6 rounded-xl space-y-4">
        <h4 className="font-['Kalam'] text-sm font-bold text-[#1b1c1c] uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          7-Factor Scoring Formula Breakdown
        </h4>

        <div className="border-2 border-[#2d2d2d] rounded-xl overflow-hidden shadow-[3px_3px_0px_#2d2d2d]">
          <table className="w-full text-left text-xs text-[#1b1c1c] font-['Karla']">
            <thead className="bg-[#f0eded] border-b-2 border-[#2d2d2d] font-['Kalam'] font-bold text-xs">
              <tr>
                <th className="p-3">Component</th>
                <th className="p-3">Default Weight</th>
                <th className="p-3">Computation Method</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#2d2d2d]/20">
              <tr>
                <td className="p-3 font-bold text-[#1b1c1c]">Semantic Relevance</td>
                <td className="p-3 font-mono text-primary font-bold">25%</td>
                <td className="p-3 text-[#424750]">
                  Cosine similarity of JD requirement chunks vs resume embeddings via local MiniLM-L6-v2.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-[#1b1c1c]">Explicit Keyword Match</td>
                <td className="p-3 font-mono text-primary font-bold">25%</td>
                <td className="p-3 text-[#424750]">
                  Ontology-normalized direct, alias, and fuzzy phrase matching (RapidFuzz).
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-[#1b1c1c]">Required Skill Coverage</td>
                <td className="p-3 font-mono text-[#1b8a3b] font-bold">20%</td>
                <td className="p-3 text-[#424750]">
                  % of must-have requirements satisfied (1.0x for direct, 0.65x for transferable).
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-[#1b1c1c]">Preferred Skill Coverage</td>
                <td className="p-3 font-mono text-[#424750] font-bold">10%</td>
                <td className="p-3 text-[#424750]">
                  % of should-have and nice-to-have skills matched.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-[#1b1c1c]">Evidence Strength</td>
                <td className="p-3 font-mono text-secondary font-bold">10%</td>
                <td className="p-3 text-[#424750]">
                  Average evidence tier (0–3) across matched skills scaled to 100%.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-[#1b1c1c]">Experience & Project Depth</td>
                <td className="p-3 font-mono text-[#424750] font-bold">5%</td>
                <td className="p-3 text-[#424750]">
                  Semantic similarity of candidate's project descriptions vs JD duties.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-[#1b1c1c]">Education & Role Fit</td>
                <td className="p-3 font-mono text-[#424750] font-bold">5%</td>
                <td className="p-3 text-[#424750]">
                  Rule-based validation of degree and engineering major requirements.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Hard Constraints & Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] space-y-2">
          <div className="flex items-center gap-2 text-[#1b8a3b]">
            <ShieldCheck className="w-4 h-4 text-[#1b8a3b]" />
            <h5 className="font-['Kalam'] text-sm font-bold text-[#1b1c1c]">Zero External APIs</h5>
          </div>
          <p className="text-[11px] text-[#424750] font-['Karla'] leading-relaxed">
            100% offline. Uses local sentence-transformers, PyMuPDF, BM25, and RapidFuzz without sending any PII over the wire.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Cpu className="w-4 h-4 text-primary" />
            <h5 className="font-['Kalam'] text-sm font-bold text-[#1b1c1c]">Deterministic Ranking</h5>
          </div>
          <p className="text-[11px] text-[#424750] font-['Karla'] leading-relaxed">
            No LLM-as-a-judge hallucinations. Explanations and scores assemble directly from inspectable evidence graph records.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border-2 border-[#2d2d2d] shadow-[3px_3px_0px_#2d2d2d] space-y-2">
          <div className="flex items-center gap-2 text-secondary">
            <CheckCircle2 className="w-4 h-4 text-secondary" />
            <h5 className="font-['Kalam'] text-sm font-bold text-[#1b1c1c]">Student Equity</h5>
          </div>
          <p className="text-[11px] text-[#424750] font-['Karla'] leading-relaxed">
            Short resumes with strong project evidence are rewarded for density without negative penalties for fewer career years.
          </p>
        </div>
      </div>
    </div>
  );
};
