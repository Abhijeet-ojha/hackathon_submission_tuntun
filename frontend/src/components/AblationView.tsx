import React, { useState, useEffect } from "react";
import { Zap, CheckCircle2, Award, Layers } from "lucide-react";
import type { AblationResult } from "../types";
import { getAblationCheck } from "../services/api";

export const AblationView: React.FC = () => {
  const [ablation, setAblation] = useState<AblationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAblation = () => {
    setIsLoading(true);
    getAblationCheck()
      .then((res) => {
        setAblation(res);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAblation();
  }, []);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Overview Card */}
      <div className="bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-6 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="font-['Kalam'] text-xl font-bold text-[#1b1c1c]">
            Ablation Verification: Dual-Signal Proof
          </h3>
        </div>
        <p className="text-xs text-[#424750] font-['Karla'] leading-relaxed max-w-3xl">
          Hard Requirement Verification: Both semantic (MiniLM neural embeddings) AND keyword/ontology signals must materially affect candidate rankings. This test isolates each component and proves that Hybrid Ranking produces a distinct, superior ordering compared to naive single-signal models.
        </p>

        {ablation?.is_divergent && (
          <div className="p-3.5 rounded-lg bg-[#eaf8ee] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] text-xs font-['Karla'] text-[#1b8a3b] font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1b8a3b] shrink-0" />
            <span>
              Ablation Proof Passed: Keyword-Only, Semantic-Only, and Hybrid models produce divergent rankings on the candidate batch.
            </span>
          </div>
        )}
      </div>

      {/* 3 Column Ranking Comparison */}
      {ablation && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Keyword Only */}
          <div className="bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-[#2d2d2d]/30">
              <div>
                <span className="font-['Kalam'] text-sm font-bold text-primary uppercase tracking-wider block">
                  1. Keyword-Only Model
                </span>
                <span className="text-[10px] text-[#737782] font-['Karla']">
                  BM25 + Token Matches (0% Semantic)
                </span>
              </div>
              <Layers className="w-4 h-4 text-primary" />
            </div>

            <div className="space-y-1.5 font-['Karla']">
              {ablation.keyword_only.slice(0, 8).map((cand) => (
                <div
                  key={cand.candidate_id}
                  className="p-2.5 bg-[#fcf9f8] rounded-lg border border-[#2d2d2d] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[#737782] text-[10px] font-bold">
                      #{cand.rank}
                    </span>
                    <span className="text-[#1b1c1c] truncate font-bold">
                      {cand.candidate_name}
                    </span>
                  </div>
                  <span className="font-mono text-primary font-bold ml-2">
                    {cand.score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Semantic Only */}
          <div className="bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_#2d2d2d] p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-[#2d2d2d]/30">
              <div>
                <span className="font-['Kalam'] text-sm font-bold text-secondary uppercase tracking-wider block">
                  2. Semantic-Only Model
                </span>
                <span className="text-[10px] text-[#737782] font-['Karla']">
                  MiniLM Cosine Similarity (0% Keyword)
                </span>
              </div>
              <Zap className="w-4 h-4 text-secondary" />
            </div>

            <div className="space-y-1.5 font-['Karla']">
              {ablation.semantic_only.slice(0, 8).map((cand) => (
                <div
                  key={cand.candidate_id}
                  className="p-2.5 bg-[#fcf9f8] rounded-lg border border-[#2d2d2d] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[#737782] text-[10px] font-bold">
                      #{cand.rank}
                    </span>
                    <span className="text-[#1b1c1c] truncate font-bold">
                      {cand.candidate_name}
                    </span>
                  </div>
                  <span className="font-mono text-secondary font-bold ml-2">
                    {cand.score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Hybrid Engine */}
          <div className="relative bg-[#fffef5] border-2 border-[#2d2d2d] shadow-[6px_6px_0px_#2d2d2d] p-5 rounded-xl space-y-3 -rotate-0.5">
            {/* Washi tape top */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-5 bg-[#e5e0d8] border border-[#2d2d2d]/30 -rotate-1 shadow-sm flex items-center justify-center pointer-events-none">
              <span className="font-['Kalam'] text-[9px] text-[#1b1c1c] font-bold uppercase">
                Dual-Signal Winner
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-[#2d2d2d]/30 mt-1">
              <div>
                <span className="font-['Kalam'] text-sm font-bold text-secondary uppercase tracking-wider block">
                  3. Full Hybrid Engine
                </span>
                <span className="text-[10px] text-[#737782] font-['Karla']">
                  Semantic + Keyword + Evidence Tiers
                </span>
              </div>
              <Award className="w-5 h-5 text-secondary" />
            </div>

            <div className="space-y-1.5 font-['Karla']">
              {ablation.hybrid.slice(0, 8).map((cand) => (
                <div
                  key={cand.candidate_id}
                  className="p-2.5 bg-white rounded-lg border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-secondary font-bold text-[10px]">
                      #{cand.rank}
                    </span>
                    <span className="text-[#1b1c1c] truncate font-extrabold">
                      {cand.candidate_name}
                    </span>
                  </div>
                  <span className="font-mono text-[#1b8a3b] font-extrabold ml-2">
                    {cand.score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
