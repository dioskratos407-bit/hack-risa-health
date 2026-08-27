export type PatientStatus = 'Monitoreo Activo' | 'Estable' | 'Alta';

export interface PatientItem {
  id: string;
  age: number;
  gender: string;
  lastEncounter: string;
  status: PatientStatus;
}

export const mockPatientsList: PatientItem[] = [
  {
    "id": "PAT-0001",
    "age": 46,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0002",
    "age": 72,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0003",
    "age": 21,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0004",
    "age": 53,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0005",
    "age": 53,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0006",
    "age": 30,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0007",
    "age": 76,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0008",
    "age": 64,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0009",
    "age": 28,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0010",
    "age": 64,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0011",
    "age": 27,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0012",
    "age": 77,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0013",
    "age": 22,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0014",
    "age": 58,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0015",
    "age": 36,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0016",
    "age": 72,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0017",
    "age": 83,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0018",
    "age": 38,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0019",
    "age": 66,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0020",
    "age": 19,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0021",
    "age": 61,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0022",
    "age": 51,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0023",
    "age": 56,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0024",
    "age": 85,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0025",
    "age": 64,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0026",
    "age": 28,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0027",
    "age": 34,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0028",
    "age": 72,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0029",
    "age": 65,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0030",
    "age": 26,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0031",
    "age": 27,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0032",
    "age": 60,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0033",
    "age": 34,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0034",
    "age": 42,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0035",
    "age": 77,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0036",
    "age": 61,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0037",
    "age": 75,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0038",
    "age": 27,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0039",
    "age": 19,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0040",
    "age": 79,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0041",
    "age": 18,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0042",
    "age": 80,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0043",
    "age": 25,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0044",
    "age": 82,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0045",
    "age": 41,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0046",
    "age": 49,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0047",
    "age": 84,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0048",
    "age": 51,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0049",
    "age": 19,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0050",
    "age": 82,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0051",
    "age": 54,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0052",
    "age": 19,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0053",
    "age": 32,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0054",
    "age": 44,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0055",
    "age": 50,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0056",
    "age": 53,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0057",
    "age": 38,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0058",
    "age": 27,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0059",
    "age": 36,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0060",
    "age": 63,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0061",
    "age": 70,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0062",
    "age": 70,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0063",
    "age": 38,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0064",
    "age": 46,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0065",
    "age": 46,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0066",
    "age": 26,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0067",
    "age": 69,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0068",
    "age": 40,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0069",
    "age": 73,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0070",
    "age": 32,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0071",
    "age": 18,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0072",
    "age": 60,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0073",
    "age": 70,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0074",
    "age": 71,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0075",
    "age": 56,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0076",
    "age": 73,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0077",
    "age": 45,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0078",
    "age": 60,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0079",
    "age": 36,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0080",
    "age": 76,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0081",
    "age": 49,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0082",
    "age": 40,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0083",
    "age": 33,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0084",
    "age": 58,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0085",
    "age": 75,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0086",
    "age": 53,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0087",
    "age": 27,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0088",
    "age": 28,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0089",
    "age": 26,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0090",
    "age": 25,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0091",
    "age": 66,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0092",
    "age": 46,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0093",
    "age": 67,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0094",
    "age": 21,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0095",
    "age": 35,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0096",
    "age": 59,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0097",
    "age": 71,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0098",
    "age": 24,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0099",
    "age": 23,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0100",
    "age": 37,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  }
];