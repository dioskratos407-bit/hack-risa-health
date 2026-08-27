export type PatientStatus = 'Monitoreo Activo' | 'Estable' | 'Alta';

export interface PatientItem {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastEncounter: string;
  status: PatientStatus;
}

export const mockPatientsList: PatientItem[] = [
  {
    "id": "PAT-0001",
    "name": "Carlos S\u00e1nchez Mart\u00ednez",
    "age": 46,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0002",
    "name": "Hugo Garc\u00eda Guerrero",
    "age": 72,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0003",
    "name": "Javier Mart\u00ednez Castillo",
    "age": 21,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0004",
    "name": "Elena Ram\u00edrez Guerrero",
    "age": 53,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0005",
    "name": "Diego Vargas G\u00f3mez",
    "age": 53,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0006",
    "name": "Camila Garc\u00eda D\u00edaz",
    "age": 30,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0007",
    "name": "Claudia S\u00e1nchez Rojas",
    "age": 76,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0008",
    "name": "Valeria Ortega P\u00e9rez",
    "age": 64,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0009",
    "name": "Alejandro Mart\u00ednez P\u00e9rez",
    "age": 28,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0010",
    "name": "Felipe S\u00e1nchez Ram\u00edrez",
    "age": 64,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0011",
    "name": "Luc\u00eda S\u00e1nchez Nu\u00f1ez",
    "age": 27,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0012",
    "name": "Hugo Mart\u00ednez L\u00f3pez",
    "age": 77,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0013",
    "name": "Gonzalo Rojas Mart\u00ednez",
    "age": 22,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0014",
    "name": "Mariana Garc\u00eda Rodr\u00edguez",
    "age": 58,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0015",
    "name": "Carmen Nu\u00f1ez Ram\u00edrez",
    "age": 36,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0016",
    "name": "Hugo Ortega S\u00e1nchez",
    "age": 72,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0017",
    "name": "Gabriela Mart\u00ednez Gonz\u00e1lez",
    "age": 83,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0018",
    "name": "Santiago Gonz\u00e1lez Nu\u00f1ez",
    "age": 38,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0019",
    "name": "Claudia Garc\u00eda D\u00edaz",
    "age": 66,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0020",
    "name": "Natalia S\u00e1nchez Ortega",
    "age": 19,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0021",
    "name": "Hugo S\u00e1nchez Nu\u00f1ez",
    "age": 61,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0022",
    "name": "Isabella Ram\u00edrez Mendoza",
    "age": 51,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0023",
    "name": "Manuel Fern\u00e1ndez Nu\u00f1ez",
    "age": 56,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0024",
    "name": "Gabriel Torres L\u00f3pez",
    "age": 85,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0025",
    "name": "Valentina Mendoza Fern\u00e1ndez",
    "age": 64,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0026",
    "name": "Elena Rojas Mart\u00ednez",
    "age": 28,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0027",
    "name": "Valeria Ortega Gonz\u00e1lez",
    "age": 34,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0028",
    "name": "Fernando Castillo Silva",
    "age": 72,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0029",
    "name": "Ricardo D\u00edaz Nu\u00f1ez",
    "age": 65,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0030",
    "name": "Camila Mart\u00ednez Mart\u00ednez",
    "age": 26,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0031",
    "name": "\u00c1lvaro Mart\u00ednez Mendoza",
    "age": 27,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0032",
    "name": "Luis Garc\u00eda Rojas",
    "age": 60,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0033",
    "name": "Fernando Morales Rodr\u00edguez",
    "age": 34,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0034",
    "name": "Elena Morales Vargas",
    "age": 42,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0035",
    "name": "Gabriela Vargas Vargas",
    "age": 77,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0036",
    "name": "Santiago Rojas D\u00edaz",
    "age": 61,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0037",
    "name": "Luis Rodr\u00edguez Rodr\u00edguez",
    "age": 75,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0038",
    "name": "Fernando Ram\u00edrez Mart\u00ednez",
    "age": 27,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0039",
    "name": "Alejandro Nu\u00f1ez Ortega",
    "age": 19,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0040",
    "name": "Diego Vargas Morales",
    "age": 79,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0041",
    "name": "Mar\u00eda L\u00f3pez D\u00edaz",
    "age": 18,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0042",
    "name": "Victoria P\u00e9rez Vargas",
    "age": 80,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0043",
    "name": "Luc\u00eda Rojas Guerrero",
    "age": 25,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0044",
    "name": "Alejandro Guerrero Morales",
    "age": 82,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0045",
    "name": "Alejandro Castillo Garc\u00eda",
    "age": 41,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0046",
    "name": "Luis D\u00edaz Fern\u00e1ndez",
    "age": 49,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0047",
    "name": "Joaqu\u00edn Garc\u00eda Vargas",
    "age": 84,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0048",
    "name": "Luc\u00eda G\u00f3mez Mart\u00ednez",
    "age": 51,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0049",
    "name": "Victoria G\u00f3mez Garc\u00eda",
    "age": 19,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0050",
    "name": "Mateo Ortega Rodr\u00edguez",
    "age": 82,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0051",
    "name": "Valeria Mart\u00ednez Torres",
    "age": 54,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0052",
    "name": "Claudia Nu\u00f1ez Castillo",
    "age": 19,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0053",
    "name": "Camila Gonz\u00e1lez S\u00e1nchez",
    "age": 32,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0054",
    "name": "Fernando P\u00e9rez Silva",
    "age": 44,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0055",
    "name": "Fernando Castillo Morales",
    "age": 50,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0056",
    "name": "Mateo Nu\u00f1ez Vargas",
    "age": 53,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0057",
    "name": "Sofia Nu\u00f1ez S\u00e1nchez",
    "age": 38,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0058",
    "name": "Andrea Mendoza Fern\u00e1ndez",
    "age": 27,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0059",
    "name": "Hugo Rojas Torres",
    "age": 36,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0060",
    "name": "Ricardo Torres Rojas",
    "age": 63,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0061",
    "name": "Santiago Torres Ortega",
    "age": 70,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0062",
    "name": "Luis L\u00f3pez L\u00f3pez",
    "age": 70,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0063",
    "name": "Rosa Mart\u00ednez S\u00e1nchez",
    "age": 38,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0064",
    "name": "Felipe Rojas Morales",
    "age": 46,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0065",
    "name": "Gabriela P\u00e9rez Mart\u00ednez",
    "age": 46,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0066",
    "name": "Felipe G\u00f3mez S\u00e1nchez",
    "age": 26,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0067",
    "name": "Gabriela Nu\u00f1ez Castillo",
    "age": 69,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0068",
    "name": "Ana Fern\u00e1ndez S\u00e1nchez",
    "age": 40,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0069",
    "name": "Mar\u00eda Fern\u00e1ndez Silva",
    "age": 73,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0070",
    "name": "Rosa Silva Castillo",
    "age": 32,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0071",
    "name": "Fernando Rojas Vargas",
    "age": 18,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0072",
    "name": "Andr\u00e9s Vargas Garc\u00eda",
    "age": 60,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0073",
    "name": "Ricardo Castillo P\u00e9rez",
    "age": 70,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0074",
    "name": "Andrea Gonz\u00e1lez Rodr\u00edguez",
    "age": 71,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0075",
    "name": "Isabella Silva Guerrero",
    "age": 56,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0076",
    "name": "Ricardo P\u00e9rez Rodr\u00edguez",
    "age": 73,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0077",
    "name": "Victoria Ram\u00edrez Ram\u00edrez",
    "age": 45,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0078",
    "name": "Mateo P\u00e9rez Castillo",
    "age": 60,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0079",
    "name": "Ricardo Mart\u00ednez Rodr\u00edguez",
    "age": 36,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0080",
    "name": "Esteban Silva Garc\u00eda",
    "age": 76,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0081",
    "name": "Felipe Morales D\u00edaz",
    "age": 49,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0082",
    "name": "Santiago Vargas Mart\u00ednez",
    "age": 40,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0083",
    "name": "Mar\u00eda Ortega Mart\u00ednez",
    "age": 33,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0084",
    "name": "Natalia Ortega Silva",
    "age": 58,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0085",
    "name": "Claudia Castillo Vargas",
    "age": 75,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0086",
    "name": "Victoria S\u00e1nchez Mart\u00ednez",
    "age": 53,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0087",
    "name": "Elena S\u00e1nchez Ram\u00edrez",
    "age": 27,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0088",
    "name": "Fernando G\u00f3mez G\u00f3mez",
    "age": 28,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0089",
    "name": "Felipe Gonz\u00e1lez Rodr\u00edguez",
    "age": 26,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0090",
    "name": "Andrea Ram\u00edrez Vargas",
    "age": 25,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0091",
    "name": "Carmen Guerrero Mendoza",
    "age": 66,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0092",
    "name": "Paula D\u00edaz Vargas",
    "age": 46,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0093",
    "name": "Rosa Morales Mendoza",
    "age": 67,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0094",
    "name": "Isabella Ram\u00edrez Gonz\u00e1lez",
    "age": 21,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0095",
    "name": "Mateo Nu\u00f1ez Vargas",
    "age": 35,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0096",
    "name": "Alejandro S\u00e1nchez D\u00edaz",
    "age": 59,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0097",
    "name": "Daniela D\u00edaz S\u00e1nchez",
    "age": 71,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  },
  {
    "id": "PAT-0098",
    "name": "Esteban Mendoza Ortega",
    "age": 24,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0099",
    "name": "Elena Nu\u00f1ez Garc\u00eda",
    "age": 23,
    "gender": "Femenino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Monitoreo Activo"
  },
  {
    "id": "PAT-0100",
    "name": "Javier Mendoza Silva",
    "age": 37,
    "gender": "Masculino",
    "lastEncounter": "26 Ago 2026 - 14:30",
    "status": "Estable"
  }
];