export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
  date?: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  assignee: {
    name: string;
    role: string;
    initials: string;
    colorClass: string;
  };
  dueDate: string;
  subtasks: Subtask[];
  dateBlock: string;
  empresa: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
};

export const USERS = {
  oswaldo: {
    name: "Oswaldo Lozano",
    role: "Senior Partner",
    initials: "OL",
    colorClass: "bg-gradient-to-r from-[#3b82f6] to-[#6366f1]"
  },
  josue: {
    name: "Josué Pinillos",
    role: "Tax Manager",
    initials: "JP",
    colorClass: "bg-gradient-to-r from-[#10b981] to-[#34d399]"
  },
  rodrigo: {
    name: "Rodrigo García",
    role: "Senior Consultant",
    initials: "RG",
    colorClass: "bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]"
  },
  valeria: {
    name: "Valeria Zumarán",
    role: "Legal Advisor",
    initials: "VZ",
    colorClass: "bg-gradient-to-r from-[#8b5cf6] to-[#a855f7]"
  }
};

export const MOCK_TASKS: Task[] = [
  {
    id: "t1",
    title: "Solicitud de información financiera",
    description: "Requerimiento de Estados Financieros, Balance de Comprobación y detalles de operaciones.",
    assignee: USERS.oswaldo,
    dueDate: "16 Mayo 2026",
    dateBlock: "2026-05-16",
    empresa: "Empresa A",
    prioridad: "Alta",
    subtasks: [
      { id: "st1-1", title: "Solicitud de EEFF", completed: true, date: "15 May" },
      { id: "st1-2", title: "Solicitud de Balance de Comprobación", completed: true, date: "15 May" },
      { id: "st1-3", title: "Detalle de operaciones intercompany", completed: true, date: "16 May" }
    ]
  },
  {
    id: "t2",
    title: "Validación de operaciones controladas",
    description: "Revisar y cruzar información de las operaciones con empresas vinculadas.",
    assignee: USERS.josue,
    dueDate: "16 Mayo 2026",
    dateBlock: "2026-05-16",
    empresa: "Empresa A",
    prioridad: "Media",
    subtasks: [
      { id: "st2-1", title: "Cruce de facturación", completed: true, date: "15 May" },
      { id: "st2-2", title: "Validación de montos", completed: true, date: "16 May" },
      { id: "st2-3", title: "Confirmación con cliente", completed: false, date: "16 May" }
    ]
  },
  {
    id: "t3",
    title: "Revisión de contratos",
    description: "Análisis legal de los contratos intercompañía vigentes durante el ejercicio fiscal.",
    assignee: USERS.valeria,
    dueDate: "16 Mayo 2026",
    dateBlock: "2026-05-16",
    empresa: "Empresa A",
    prioridad: "Alta",
    subtasks: [
      { id: "st3-1", title: "Recepción de contratos", completed: true, date: "15 May" },
      { id: "st3-2", title: "Lectura y análisis de cláusulas", completed: false, date: "16 May" },
      { id: "st3-3", title: "Identificación de riesgos", completed: false, date: "16 May" },
      { id: "st3-4", title: "Elaboración de resumen", completed: false, date: "16 May" }
    ]
  },
  {
    id: "t4",
    title: "Elaboración de Reporte Local",
    description: "Elaborar el Reporte Local de Precios de Transferencia conforme la normativa vigente.",
    assignee: USERS.oswaldo,
    dueDate: "17 Mayo 2026",
    dateBlock: "2026-05-17",
    empresa: "Empresa B",
    prioridad: "Alta",
    subtasks: [
      { id: "st4-1", title: "Solicitud de EEFF", completed: true, date: "15 May" },
      { id: "st4-2", title: "Validación de operaciones controladas", completed: true, date: "15 May" },
      { id: "st4-3", title: "Revisión contractual", completed: false, date: "16 May" },
      { id: "st4-4", title: "Elaboración de análisis funcional", completed: false, date: "17 May" },
      { id: "st4-5", title: "Revisión económica", completed: false, date: "17 May" }
    ]
  },
  {
    id: "t5",
    title: "Revisión de Test de Beneficio",
    description: "Verificar la necesidad y prestación efectiva de los servicios recibidos intragrupo.",
    assignee: USERS.rodrigo,
    dueDate: "17 Mayo 2026",
    dateBlock: "2026-05-17",
    empresa: "Empresa B",
    prioridad: "Media",
    subtasks: [
      { id: "st5-1", title: "Identificación de servicios", completed: false, date: "16 May" },
      { id: "st5-2", title: "Análisis de costos", completed: false, date: "17 May" }
    ]
  },
  {
    id: "t6",
    title: "Análisis económico",
    description: "Realizar los cálculos y validaciones económicas de rentabilidad de las transacciones.",
    assignee: USERS.josue,
    dueDate: "18 Mayo 2026",
    dateBlock: "2026-05-18",
    empresa: "Empresa C",
    prioridad: "Alta",
    subtasks: [
      { id: "st6-1", title: "Segmentación financiera", completed: true, date: "17 May" },
      { id: "st6-2", title: "Cálculo de márgenes", completed: false, date: "18 May" },
      { id: "st6-3", title: "Ajustes de capital", completed: false, date: "18 May" },
      { id: "st6-4", title: "Ajustes de riesgo", completed: false, date: "18 May" },
      { id: "st6-5", title: "Conclusiones preliminares", completed: false, date: "18 May" }
    ]
  },
  {
    id: "t7",
    title: "Búsqueda de comparables",
    description: "Identificar y depurar empresas comparables en bases de datos financieras.",
    assignee: USERS.rodrigo,
    dueDate: "18 Mayo 2026",
    dateBlock: "2026-05-18",
    empresa: "Empresa C",
    prioridad: "Media",
    subtasks: [
      { id: "st7-1", title: "Definición de estrategia de búsqueda", completed: false, date: "17 May" },
      { id: "st7-2", title: "Búsqueda en base de datos", completed: false, date: "18 May" },
      { id: "st7-3", title: "Revisión cuantitativa", completed: false, date: "18 May" },
      { id: "st7-4", title: "Revisión cualitativa", completed: false, date: "18 May" }
    ]
  },
  {
    id: "t8",
    title: "Validación de EEFF",
    description: "Revisión final de los estados financieros ajustados.",
    assignee: USERS.josue,
    dueDate: "19 Mayo 2026",
    dateBlock: "2026-05-19",
    empresa: "Empresa A",
    prioridad: "Alta",
    subtasks: [
      { id: "st8-1", title: "Cruce con contabilidad", completed: false, date: "19 May" },
      { id: "st8-2", title: "Conciliación de saldos", completed: false, date: "19 May" }
    ]
  },
  {
    id: "t9",
    title: "Revisión de anexos",
    description: "Preparar y revisar los anexos para la presentación de la declaración jurada.",
    assignee: USERS.valeria,
    dueDate: "20 Mayo 2026",
    dateBlock: "2026-05-20",
    empresa: "Empresa B",
    prioridad: "Baja",
    subtasks: [
      { id: "st9-1", title: "Preparación de formatos", completed: false, date: "19 May" },
      { id: "st9-2", title: "Carga de datos", completed: false, date: "20 May" },
      { id: "st9-3", title: "Revisión de validadores", completed: false, date: "20 May" }
    ]
  }
];

export const TIMELINE_DAYS = [
  { date: "2026-05-16", label: "16 MAY 2026" },
  { date: "2026-05-17", label: "17 MAY 2026" },
  { date: "2026-05-18", label: "18 MAY 2026" },
  { date: "2026-05-19", label: "19 MAY 2026" },
  { date: "2026-05-20", label: "20 MAY 2026" },
  { date: "2026-05-21", label: "21 MAY 2026" },
  { date: "2026-05-22", label: "22 MAY 2026" }
];
