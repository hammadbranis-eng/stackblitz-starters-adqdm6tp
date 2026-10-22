// Test du moteur clinique (Calcul QTc et Anisosphygmie)

function computeBazettQtc(qtMs: number, hr: number): number {
  const rrSec = 60 / hr;
  return Math.round(qtMs / Math.sqrt(rrSec));
}

function checkAnisosphygmia(sbpRight: number, sbpLeft: number) {
  const delta = Math.abs(sbpRight - sbpLeft);
  if (delta >= 15) {
    return `⚠️ ALERTE : Asymétrie tensionnelle de ${delta} mmHg (≥ 15 mmHg) !`;
  }
  return `✅ Pression symétrique (Δ ${delta} mmHg)`;
}

// Simulation d'un patient
const patient = {
  fc: 75,
  qt: 450,
  pasBrasDroit: 145,
  pasBrasGauche: 125,
};

const qtc = computeBazettQtc(patient.qt, patient.fc);
console.log("--- RÉSULTATS DU DOSSIER CARDIOLOGIQUE ---");
console.log(`FC: ${patient.fc} bpm | QT: ${patient.qt} ms`);
console.log(`QTc calculé (Bazett): ${qtc} ms ${qtc >= 460 ? "(Allongé)" : "(Normal)"}`);
console.log(checkAnisosphygmia(patient.pasBrasDroit, patient.pasBrasGauche));