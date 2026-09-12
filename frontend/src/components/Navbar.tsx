import React from "react";
import {
  Layers,
  Grid,
  GitCompare,
  ShieldCheck,
  Zap,
  HelpCircle,
  Sliders,
  FileText,
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenWeights: () => void;
  onLoadSample: () => void;
  isLoading: boolean;
  totalCandidates: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenWeights,
}) => {
  const tabs = [
    { id: "dashboard", label: "Ranked Shortlist", icon: Layers },
    { id: "setup", label: "Set Up Workspace", icon: FileText },
    { id: "matrix", label: "Skill Gap Matrix", icon: Grid },
    { id: "compare", label: "Compare Dossier", icon: GitCompare },
    { id: "eval-lab", label: "Evaluation Lab", icon: Zap },
    { id: "bias", label: "JD Bias Inspector", icon: ShieldCheck },
    { id: "ablation", label: "Ablation Proof", icon: HelpCircle },
    { id: "how-it-works", label: "How It Works", icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#fdfbf7] border-b-2 border-[#2d2d2d] shadow-[0_3px_0px_#2d2d2d]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab("dashboard")} 
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white border-2 border-[#2d2d2d] flex items-center justify-center shadow-[2px_2px_0px_#2d2d2d] -rotate-2 group-hover:rotate-0 transition-transform">
              <span className="material-symbols-outlined text-primary text-2xl">gesture</span>
            </div>
            <div>
              <span className="font-['Kalam'] font-bold text-2xl sm:text-3xl text-on-surface tracking-tight leading-none block">
                Intern<span className="text-secondary">Loom</span>
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`paper-btn flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs lg:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#074588] text-white border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] -rotate-1"
                      : "text-[#424750] hover:text-[#1b1c1c] hover:bg-[#f0eded] border-2 border-transparent hover:border-[#2d2d2d]/30"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-[#737782]"}`} />
                  <span className={isActive ? "text-white font-bold" : ""}>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenWeights}
              className="paper-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f6f3f2] hover:bg-[#eae7e7] text-[#2d2d2d] font-['Karla'] font-bold text-xs border-2 border-[#2d2d2d] shadow-[2px_2px_0px_#2d2d2d] rounded cursor-pointer"
              title="Customize scoring formula weights & archetypes"
            >
              <Sliders className="w-3.5 h-3.5 text-primary" />
              <span>Weights</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
