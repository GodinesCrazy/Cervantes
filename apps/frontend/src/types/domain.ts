export type Project = {
  id: number;
  name: string;
  slug: string;
  status: string;
  currentPhase: string;
  goNoGoScore?: number | null;
  goNoGoResult?: string | null;
  createdAt: string;
  updatedAt: string;
  idea?: EbookIdea | null;
  clarifications?: ClarificationQuestion[];
  marketResearch?: Record<string, unknown> | null;
  languageOpportunity?: Record<string, unknown> | null;
  editorialFormula?: Record<string, unknown> | null;
  editorialBible?: Record<string, unknown> | null;
  visualBible?: Record<string, unknown> | null;
  chapterPlans?: ChapterPlan[];
  manuscriptBlocks?: ManuscriptBlock[];
  auditReports?: Record<string, unknown>[];
  recoveryReports?: Record<string, unknown>[];
  formatBuilds?: FormatBuild[];
  metadataPackage?: Record<string, unknown> | null;
  publishingChecklist?: Record<string, unknown> | null;
  exportPackages?: Record<string, unknown>[];
  phaseGates?: PhaseGate[];
  aiUsageLogs?: Record<string, unknown>[];
  sourceNotes?: Record<string, unknown>[];
  visualAssets?: VisualAsset[];
  publicationReadiness?: Record<string, unknown> | null;
  backupRecords?: Record<string, unknown>[];
};

export type EbookIdea = {
  rawIdea: string;
  topic?: string | null;
  audience?: string | null;
  tone?: string | null;
};

export type ClarificationQuestion = {
  id: number;
  question: string;
  answer?: string | null;
  order: number;
};

export type ChapterPlan = {
  id: number;
  chapterNumber: number;
  title: string;
  summary?: string | null;
  estimatedWords?: number | null;
  status: string;
  order: number;
};

export type ManuscriptBlock = {
  id: number;
  blockTitle: string;
  content?: string | null;
  status: string;
  wordCount?: number | null;
  order: number;
};

export type FormatBuild = {
  id: number;
  format: string;
  filePath?: string | null;
  fileSize?: number | null;
  status: string;
  createdAt: string;
};

export type PhaseGate = {
  id: number;
  phase: string;
  status: string;
  notes?: string | null;
  overrideReason?: string | null;
  approvedAt?: string | null;
};

export type VisualAsset = {
  id: number;
  assetType: string;
  name: string;
  description?: string | null;
  prompt?: string | null;
  filePath?: string | null;
  status: string;
  approvalStatus: string;
  rights?: string | null;
  replacementPath?: string | null;
};
