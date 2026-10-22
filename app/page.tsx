"use client";

import React, { useState, useMemo } from "react";

// --- TYPES & STRUCTURE CLINIQUE ---
type ConsultationType = "FIRST_VISIT" | "ROUTINE_FOLLOW_UP" | "POST_EVENT" | "URGENT";
type CongestionLevel = "NONE" | "MILD" | "MODERATE" | "SEVERE";
type NYHAClass = "I" | "II" | "III" | "IV";

interface ClinicalObservationState {
  consultationType: ConsultationType;
  smokingStatus: "NEVER" | "ACTIVE" | "WEANED";
  hasDiabetes: boolean;
  hasHypertension: boolean;
  hasDyslipidemia: boolean;
  familyHxEarlyCAD: boolean;
  hasSleepApnea: boolean;

  sbpRightArm: number;
  dbpRightArm: number;
  sbpLeftArm: number;
  dbpLeftArm: number;
  sbpStanding: number;
  dbpStanding: number;
  heartRate: number;

  weightKg: number;
  heightCm: number;

  peripheralEdema: CongestionLevel;
  jugularDistension: boolean;
  pulmonaryCrackles: CongestionLevel;

  nyhaClass: NYHAClass;
  ccsAnginaClass: number;

  ecgRhythm: string;
  ecgHeartRate: number;
  prIntervalMs: number;
  qrsDurationMs: number;
  qtIntervalMs: number;
}

export default function CardioConsultationDashboard() {
  const [data, setData] = useState<ClinicalObservationState>({
    consultationType: "FIRST_VISIT",
    smokingStatus: "WEANED",
    hasDiabetes: true,
    hasHypertension: true,
    hasDyslipidemia: true,
    familyHxEarlyCAD: false,
    hasSleepApnea: false,

    sbpRightArm: 145,
    dbpRightArm: 85,
    sbpLeftArm: 125, // Delta de 20 mmHg -> déclenche l'alerte d'anisosphygmie
    dbpLeftArm: 80,
    sbpStanding: 130,
    dbpStanding: 80,
    heartRate: 72,

    weightKg: 82,
    heightCm: 174,

    peripheralEdema: "NONE",
    jugularDistension: false,
    pulmonaryCrackles: "NONE",

    nyhaClass: "II",
    ccsAnginaClass: 1,

    ecgRhythm: "Sinusal",
    ecgHeartRate: 72,
    prIntervalMs: 160,
    qrsDurationMs: 95,
    qtIntervalMs: 440,
  });

  // Calculs biomédicaux instantanés
  const bmi = useMemo(() => {
    if (data.heightCm <= 0) return 0;
    const h = data.heightCm / 100;
    return Number((data.weightKg / (h * h)).toFixed(1));
  }, [data.weightKg, data.heightCm]);

  const qtc = useMemo(() => {
    if (data.ecgHeartRate <= 0 || data.qtIntervalMs <= 0) return 0;
    const rrSec = 60 / data.ecgHeartRate;
    return Math.round(data.qtIntervalMs / Math.sqrt(rrSec));
  }, [data.qtIntervalMs, data.ecgHeartRate]);

  // Moteur d'audit clinique direct
  const alerts = useMemo(() => {
    const list: { id: string; level: "WARNING" | "CRITICAL"; title: string; text: string }[] = [];

    // 1. Asymétrie tensionnelle
    const deltaSbp = Math.abs(data.sbpRightArm - data.sbpLeftArm);
    if (deltaSbp >= 15) {
      list.push({
        id: "ANISO",
        level: "WARNING",
        title: `Asymétrie tensionnelle significative (Δ ${deltaSbp} mmHg)`,
        text: "Différence de PAS ≥ 15 mmHg. Consigner le bras le plus haut pour le suivi et suspecter une sténose sous-clavière ou une aortopathie.",
      });
    }

    // 2. Allongement du QTc (Formule de Bazett)
    if (qtc >= 500) {
      list.push({
        id: "QTC_CRIT",
        level: "CRITICAL",
        title: `Allongement critique du QTc (${qtc} ms)`,
        text: "QTc ≥ 500 ms : risque élevé de Torsades de Pointes. Bilan ionique urgent (K+, Mg2+) et arrêt des médicaments torsadogènes.",
      });
    } else if (qtc >= 460) {
      list.push({
        id: "QTC_WARN",
        level: "WARNING",
        title: `QTc limite/allongé (${qtc} ms)`,
        text: "Valeur supérieure aux seuils physiologiques (> 450 ms H / > 460 ms F). Surveillance électrocardiographique requise.",
      });
    }

    // 3. Décompensation congestive
    const severeEdema = data.peripheralEdema === "MODERATE" || data.peripheralEdema === "SEVERE";
    const severeCrackles = data.pulmonaryCrackles === "MODERATE" || data.pulmonaryCrackles === "SEVERE";
    if (severeEdema && (severeCrackles || data.jugularDistension)) {
      list.push({
        id: "CONGESTION",
        level: "CRITICAL",
        title: "Syndrome congestif biventriculaire franc",
        text: "Signes de congestion périphérique et pulmonaire associés. Ajuster immédiatement la posologie des diurétiques de l'anse.",
      });
    }

    return list;
  }, [data, qtc]);

  const update = <K extends keyof ClinicalObservationState>(k: K, v: ClinicalObservationState[K]) => {
    setData((prev) => ({ ...prev, [k]: v }));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-5">
        
        {/* En-tête Dossier */}
        <header className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-white">
                IPP: CARD-2026-904
              </span>
              <h1 className="text-lg font-bold text-slate-900">M. DUPONT Jean — 68 ans</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Cardiopathie ischémique • HTA • Diabète de type 2</p>
          </div>

          <div className="flex gap-1.5">
            {(["FIRST_VISIT", "ROUTINE_FOLLOW_UP", "POST_EVENT", "URGENT"] as const).map((t) => (
              <button
                key={t}
                onClick={() => update("consultationType", t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  data.consultationType === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t === "FIRST_VISIT" && "1ère Consultation"}
                {t === "ROUTINE_FOLLOW_UP" && "Suivi Systématique"}
                {t === "POST_EVENT" && "Post-Événement"}
                {t === "URGENT" && "Urgence"}
              </button>
            ))}
          </div>
        </header>

        {/* Fiche d'observation en 3 volets */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          
          {/* Volet 1 : Terrain & Facteurs de Risque (3 cols) */}
          <section className="md:col-span-3 space-y-4 md:pr-4 md:border-r border-slate-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Facteurs de Risque</h2>
            
            <div className="space-y-1.5">
              <label className="text-xs text-slate-600 block">Tabagisme</label>
              <div className="grid grid-cols-3 gap-1">
                {(["NEVER", "ACTIVE", "WEANED"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => update("smokingStatus", st)}
                    className={`py-1 text-xs font-semibold rounded border ${
                      data.smokingStatus === st ? "bg-slate-800 text-white border-slate-800" : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    {st === "NEVER" ? "Non" : st === "ACTIVE" ? "Actif" : "Sevré"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs text-slate-600 block">Comorbidités actives</label>
              {[
                { k: "hasHypertension", label: "Hypertension Artérielle" },
                { k: "hasDiabetes", label: "Diabète Type 2" },
                { k: "hasDyslipidemia", label: "Dyslipidémie" },
                { k: "familyHxEarlyCAD", label: "Hérédité coronarienne" },
                { k: "hasSleepApnea", label: "Apnée du Sommeil (SAS)" },
              ].map((item) => {
                const active = data[item.k as keyof ClinicalObservationState] as boolean;
                return (
                  <button
                    key={item.k}
                    onClick={() => update(item.k as keyof ClinicalObservationState, !active as any)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      active ? "bg-indigo-50 border-indigo-200 text-indigo-900" : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`w-2 h-2 rounded-full ${active ? "bg-indigo-600" : "bg-slate-300"}`} />
                  </button>
                );
              })}
            </div>
          </section>

          {/* Volet 2 : Examen Clinique & Hémodynamique (5 cols) */}
          <section className="md:col-span-5 space-y-4 md:px-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Examen Hémodynamique</h2>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
              <span className="text-xs font-semibold text-slate-700 block">Pression Artérielle Bilatérale (mmHg)</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Bras Droit (Réf)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={data.sbpRightArm}
                      onChange={(e) => update("sbpRightArm", Number(e.target.value))}
                      className="w-full p-1.5 text-center font-bold text-sm bg-white border border-slate-300 rounded"
                    />
                    <span className="text-slate-400">/</span>
                    <input
                      type="number"
                      value={data.dbpRightArm}
                      onChange={(e) => update("dbpRightArm", Number(e.target.value))}
                      className="w-full p-1.5 text-center font-bold text-sm bg-white border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Bras Gauche</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={data.sbpLeftArm}
                      onChange={(e) => update("sbpLeftArm", Number(e.target.value))}
                      className="w-full p-1.5 text-center font-bold text-sm bg-white border border-slate-300 rounded"
                    />
                    <span className="text-slate-400">/</span>
                    <input
                      type="number"
                      value={data.dbpLeftArm}
                      onChange={(e) => update("dbpLeftArm", Number(e.target.value))}
                      className="w-full p-1.5 text-center font-bold text-sm bg-white border border-slate-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="text-[11px] text-slate-500 block">FC (bpm)</label>
                <input
                  type="number"
                  value={data.heartRate}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    update("heartRate", val);
                    update("ecgHeartRate", val);
                  }}
                  className="w-full mt-1 p-1 font-bold text-center bg-white border border-slate-300 rounded text-sm"
                />
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="text-[11px] text-slate-500 block">Poids (kg)</label>
                <input
                  type="number"
                  value={data.weightKg}
                  onChange={(e) => update("weightKg", Number(e.target.value))}
                  className="w-full mt-1 p-1 font-bold text-center bg-white border border-slate-300 rounded text-sm"
                />
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                <label className="text-[11px] text-slate-500 block">IMC Déduit</label>
                <span className="block mt-1.5 font-bold text-sm text-slate-800">
                  {bmi} <span className="text-[10px] text-slate-500">kg/m²</span>
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-slate-700 block">Signes Physiques de Congestion</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-1">Œdèmes des membres inférieurs</span>
                  <div className="grid grid-cols-4 gap-1">
                    {(["NONE", "MILD", "MODERATE", "SEVERE"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => update("peripheralEdema", lvl)}
                        className={`py-1 text-[11px] font-bold rounded ${
                          data.peripheralEdema === lvl ? "bg-slate-900 text-white" : "bg-white border text-slate-600"
                        }`}
                      >
                        {lvl === "NONE" ? "0" : lvl === "MILD" ? "+" : lvl === "MODERATE" ? "++" : "+++"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-1">Râles crépitants pulmonaires</span>
                  <div className="grid grid-cols-4 gap-1">
                    {(["NONE", "MILD", "MODERATE", "SEVERE"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => update("pulmonaryCrackles", lvl)}
                        className={`py-1 text-[11px] font-bold rounded ${
                          data.pulmonaryCrackles === lvl ? "bg-slate-900 text-white" : "bg-white border text-slate-600"
                        }`}
                      >
                        {lvl === "NONE" ? "0" : lvl === "MILD" ? "Bas." : lvl === "MODERATE" ? "1/3" : "OAP"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Volet 3 : ECG & Scores Fonctionnels (4 cols) */}
          <section className="md:col-span-4 space-y-4 md:pl-4 md:border-l border-slate-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">3. ECG & Dyspnée NYHA</h2>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
              <span className="text-xs font-semibold text-slate-700 block">Intervalles ECG de repos</span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <label className="text-[10px] text-slate-500 block">PR (ms)</label>
                  <input
                    type="number"
                    value={data.prIntervalMs}
                    onChange={(e) => update("prIntervalMs", Number(e.target.value))}
                    className="w-full mt-1 p-1 text-xs bg-white border border-slate-300 rounded text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">QRS (ms)</label>
                  <input
                    type="number"
                    value={data.qrsDurationMs}
                    onChange={(e) => update("qrsDurationMs", Number(e.target.value))}
                    className={`w-full mt-1 p-1 text-xs font-bold bg-white border rounded text-center ${
                      data.qrsDurationMs >= 120 ? "border-amber-500 text-amber-800" : "border-slate-300"
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">QT (ms)</label>
                  <input
                    type="number"
                    value={data.qtIntervalMs}
                    onChange={(e) => update("qtIntervalMs", Number(e.target.value))}
                    className="w-full mt-1 p-1 text-xs bg-white border border-slate-300 rounded text-center"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600">QTc calculé (Bazett) :</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    qtc >= 500
                      ? "bg-rose-100 text-rose-900"
                      : qtc >= 460
                      ? "bg-amber-100 text-amber-900"
                      : "bg-emerald-100 text-emerald-900"
                  }`}
                >
                  {qtc} ms
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-700">Dyspnée d&apos;effort (NYHA)</span>
                <span className="text-xs font-bold text-slate-900">Stade {data.nyhaClass}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(["I", "II", "III", "IV"] as const).map((stade) => (
                  <button
                    key={stade}
                    onClick={() => update("nyhaClass", stade)}
                    className={`py-1.5 text-xs font-semibold rounded border ${
                      data.nyhaClass === stade ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    {stade}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Drapeaux Cliniques Détectés en direct (CDSS Alerts) */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Alertes de Sécurité Clinique ({alerts.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alerts.map((al) => (
                <div
                  key={al.id}
                  className={`p-3.5 rounded-lg border-l-4 text-xs ${
                    al.level === "CRITICAL"
                      ? "bg-rose-50 border-rose-500 text-rose-950"
                      : "bg-amber-50 border-amber-500 text-amber-950"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="uppercase text-[10px] px-1 py-0.2 bg-white/80 rounded font-bold">
                      {al.level}
                    </span>
                    <span>{al.title}</span>
                  </div>
                  <p className="mt-1 leading-relaxed opacity-90">{al.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}