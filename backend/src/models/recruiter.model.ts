export interface IRecruiter {
  id: string;
  userId: string;
  company: string;
  title: string;
  pipeline: IPipelineEntry[];
  savedSearches: ISavedSearch[];
}

export interface IPipelineEntry {
  candidateId: string;
  status: 'discovered' | 'screened' | 'interviewing' | 'offered' | 'hired' | 'rejected';
  notes?: string;
  updatedAt: Date;
}

export interface ISavedSearch {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: Date;
}
