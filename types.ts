
export interface Worker {
  name: string;
  id: string;
  role: string;
  email: string;
  signature?: string;
}

export interface AIRiskAnalysis {
  id: string;
  risk: string;
  category: string;
  controlMeasure: string;
  colombianRegulation: string;
  severity: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  acknowledged: boolean;
}

export interface TaskStep {
  step: string;
  risk: string;
  control: string;
  acknowledged: boolean;
}

export interface ATSData {
  activity: {
    creationDate: string;
    startDate: string;
    endDate: string;
    orderNo: string;
    company: string;
    location: string;
    address: string;
    workerCount: number;
    tools: string;
    taskDescription: string;
    serviceCallNo: string;
    hasCaseAssociated: string;
    heightDepth: string;
    atsLinkRef: string;
    requiresPermit: string;
    permitNo: string;
    hasWorkPlan?: boolean;
  };
  risks: { [key: string]: string };
  health: {
    rested: boolean;
    medicated: boolean;
    emotionalState: boolean;
    prepared: boolean;
    optimalCondition: boolean;
  };
  verification: { [key: string]: boolean };
  controls: {
    epp: { [key: string]: string };
    other: { [key: string]: string };
  };
  analysis: TaskStep[];
  photos: string[];
  aiRecommendations: AIRiskAnalysis[];
  team: Worker[];
  signatures: {
    hse: string;
    hseName: string;
    hseId: string;
    supervisor: string;
    supName: string;
    supId: string;
  };
}

export type Step = 
  | 'CONTEXT' 
  | 'VISION' 
  | 'RISKS' 
  | 'HEALTH' 
  | 'CONTROLS' 
  | 'ANALYSIS' 
  | 'VERIFICATION' 
  | 'TEAM' 
  | 'SUMMARY';
