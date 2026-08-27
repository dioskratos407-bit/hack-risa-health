export interface ClinicalCluster {
  name: string;
  variables: string[];
}

export const CLINICAL_CLUSTERS: Record<string, ClinicalCluster> = {
  HEMODINAMICO: {
    name: "Sistema Cardiovascular",
    variables: ["HR", "SYS_BP", "DIA_BP"],
  },
  RESPIRATORIO: {
    name: "Sistema Respiratorio",
    variables: ["RESP", "SpO2"],
  },
  METABOLICO: {
    name: "Metabolismo y Temperatura",
    variables: ["TEMP"],
  },
  ACTIVIDAD: {
    name: "Actividad y Movilidad",
    variables: ["STEPS", "ACTIVITY_LEVEL"],
  },
};

export function getVariablesForCluster(clusterKey: string): string[] {
  if (!clusterKey) return [];
  const normalizedKey = clusterKey.toUpperCase();
  const cluster = CLINICAL_CLUSTERS[normalizedKey];
  return cluster ? cluster.variables : [];
}

export function getAllVariables(): string[] {
  const all = new Set<string>();
  Object.values(CLINICAL_CLUSTERS).forEach((cluster) => {
    cluster.variables.forEach((v) => all.add(v));
  });
  return Array.from(all);
}
