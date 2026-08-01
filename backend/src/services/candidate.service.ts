import { prisma } from '../lib/prisma.js';
/**
 * Reads page/pageSize off a query object.
 *
 * Express 5 hands us a null-prototype object, so the value is never coerced
 * directly — `Number(Object.create(null))` throws.
 */
const pg = (query: unknown) => {
  const source = (query ?? {}) as Record<string, unknown>;
  const num = (value: unknown, fallback: number) => {
    const parsed = Number(Array.isArray(value) ? value[0] : value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };
  const page = Math.max(1, Math.floor(num(source.page, 1)));
  const pageSize = Math.min(100, Math.max(1, Math.floor(num(source.pageSize, 20))));
  return { skip: (page - 1) * pageSize, page, pageSize };
};
const parse=(v:string|null)=>{try{return v?JSON.parse(v):[]}catch{return []}};
export async function dashboard(candidateId:string){const [candidate,evidence,roadmap,applications]=await prisma.$transaction([prisma.candidate.findUniqueOrThrow({where:{id:candidateId},include:{profile:true}}),prisma.evidence.groupBy({by:['status'],where:{candidateId},_count:true}),prisma.roadmapItem.count({where:{candidateId,completedAt:{not:null}}}),prisma.jobApplication.count({where:{candidateId}})]);return {candidate,evidence,stats:{roadmapCompleted:roadmap,applications}}}
export async function profile(candidateId:string){const candidate=await prisma.candidate.findUniqueOrThrow({where:{id:candidateId}});const profile=await prisma.candidateProfile.upsert({where:{candidateId},create:{candidateId},update:{},include:{links:true}});return {candidate,profile:{...profile,projects:parse(profile.projectsJson),credentials:parse(profile.credentialsJson),workHistory:parse(profile.workHistoryJson),draft:parse(profile.draftJson)}}}
export async function updateProfile(candidateId:string,input:any,actorId:string){const allowed=['name','title','location','bio','avatar'];const candidateData=Object.fromEntries(Object.entries(input).filter(([k])=>allowed.includes(k)));const profileData:any={};for(const key of ['headline','phone','website','visibility'])if(input[key]!==undefined)profileData[key]=input[key];for(const [field,key] of [['projects','projectsJson'],['credentials','credentialsJson'],['workHistory','workHistoryJson'],['draft','draftJson']] as const)if(input[field]!==undefined)profileData[key]=JSON.stringify(input[field]);if(input.publish===true)profileData.publishedAt=new Date();await prisma.$transaction([prisma.candidate.update({where:{id:candidateId},data:candidateData}),prisma.candidateProfile.upsert({where:{candidateId},create:{candidateId,...profileData},update:profileData}),prisma.auditLog.create({data:{candidateId,actorId,action:input.publish?'profile.published':'profile.updated',entityType:'profile',entityId:candidateId}})]);return profile(candidateId)}
export async function listRoadmap(candidateId:string){return prisma.roadmapItem.findMany({where:{candidateId},orderBy:[{position:'asc'},{createdAt:'asc'}]})}
export async function createRoadmap(candidateId:string,input:any){if(!input.title?.trim())throw new Error('A roadmap title is required');const count=await prisma.roadmapItem.count({where:{candidateId}});return prisma.roadmapItem.create({data:{candidateId,title:input.title.trim(),description:input.description?.trim()||null,dueAt:input.dueAt?new Date(input.dueAt):null,position:Number.isInteger(input.position)?input.position:count}})}
export async function updateRoadmap(candidateId:string,id:string,input:any){const row=await prisma.roadmapItem.findFirst({where:{id,candidateId}});if(!row)throw new Error('Roadmap item not found');return prisma.roadmapItem.update({where:{id},data:{...(input.title!==undefined?{title:input.title.trim()}:{}),...(input.description!==undefined?{description:input.description?.trim()||null}:{}),...(input.position!==undefined?{position:Number(input.position)}:{}),...(input.complete!==undefined?{completedAt:input.complete?new Date():null}:{})}})}
export async function deleteRoadmap(candidateId:string,id:string){const row=await prisma.roadmapItem.findFirst({where:{id,candidateId}});if(!row)throw new Error('Roadmap item not found');return prisma.roadmapItem.delete({where:{id}})}
export async function resumes(candidateId:string){return prisma.resume.findMany({where:{candidateId},include:{versions:{orderBy:{version:'desc'}}},orderBy:{updatedAt:'desc'}})}
export async function saveResume(candidateId:string,input:any){if(!input.name?.trim())throw new Error('A resume name is required');return prisma.$transaction(async tx=>{let resume:any;if(input.id){resume=await tx.resume.findFirst({where:{id:input.id,candidateId}});if(!resume)throw new Error('Resume not found');resume=await tx.resume.update({where:{id:resume.id},data:{name:input.name.trim(),template:input.template||resume.template}})}else resume=await tx.resume.create({data:{candidateId,name:input.name.trim(),template:input.template||'modern'}});const latest=await tx.resumeVersion.aggregate({_max:{version:true},where:{resumeId:resume.id}});const version=await tx.resumeVersion.create({data:{resumeId:resume.id,version:(latest._max.version||0)+1,contentJson:JSON.stringify(input.content||{})}});return tx.resume.update({where:{id:resume.id},data:{activeVersionId:version.id},include:{versions:true}})})}
export async function jobs(candidateId:string,query:any){const {skip,page,pageSize}=pg(query);const where={isActive:true};const [items,total]=await prisma.$transaction([prisma.job.findMany({where,include:{applications:{where:{candidateId},select:{id:true,status:true,updatedAt:true}}},skip,take:pageSize,orderBy:{createdAt:'desc'}}),prisma.job.count({where})]);return {jobs:items,page,pageSize,total}}
export async function setApplication(candidateId:string,jobId:string,status:string,notes?:string){const valid=['SAVED','APPLIED','SCREENING','INTERVIEW','OFFER','REJECTED','WITHDRAWN','IGNORED'];if(!valid.includes(status))throw new Error('Invalid application status');await prisma.job.findUniqueOrThrow({where:{id:jobId}});const old=await prisma.jobApplication.findUnique({where:{candidateId_jobId:{candidateId,jobId}}});const history=[...parse(old?.historyJson||null),{status,at:new Date().toISOString(),notes:notes||null}];return prisma.jobApplication.upsert({where:{candidateId_jobId:{candidateId,jobId}},create:{candidateId,jobId,status:status as never,notes:notes||null,historyJson:JSON.stringify(history)},update:{status:status as never,notes:notes||null,historyJson:JSON.stringify(history)}})}

// ---------------------------------------------------------------------------
// Career intelligence: resume drafting, portfolio, salary, learning, badges.
// These read from the candidate's verified evidence and skill graph so the
// output is always grounded in what the platform can actually prove.
// ---------------------------------------------------------------------------

/** Builds an evidence-backed resume draft ready for the resume builder UI. */
export async function generateResumeDraft(candidateId: string, targetRole?: string) {
  const { generateResumeDraft: build } = await import('./career.service.js');
  return build(candidateId, targetRole);
}

/** Assembles a portfolio outline from the candidate's strongest projects. */
export async function generatePortfolio(candidateId: string) {
  const { generatePortfolio: build } = await import('./career.service.js');
  return build(candidateId);
}

/** Predicts a salary band from role family, region, seniority and talent score. */
export async function predictSalary(candidateId: string) {
  const { predictSalary: predict } = await import('./career.service.js');
  return predict(candidateId);
}

/** Recommends learning resources for the candidate's highest-impact skill gaps. */
export async function recommendLearning(candidateId: string) {
  const { recommendLearning: recommend } = await import('./career.service.js');
  return recommend(candidateId);
}

/** Returns the candidate's earned verification badges. */
export async function badges(candidateId: string) {
  const { listBadges } = await import('./career.service.js');
  return listBadges(candidateId);
}
