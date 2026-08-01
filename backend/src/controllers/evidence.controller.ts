import { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import * as service from '../services/evidence.service.js';
const candidateId=(req:AuthenticatedRequest)=>String(req.params.candidateId || req.user?.id);
const fail=(res:Response,error:unknown)=>res.status(error instanceof Error && /not found/.test(error.message)?404:400).json({error:error instanceof Error?error.message:'Request failed'});
export const list=async(req:AuthenticatedRequest,res:Response)=>{try{res.json(await service.listEvidence(candidateId(req),req.query as any));}catch(e){fail(res,e)}};
export const get=async(req:AuthenticatedRequest,res:Response)=>{try{res.json({evidence:await service.getEvidence(candidateId(req),req.params.evidenceId)});}catch(e){fail(res,e)}};
export const create=async(req:AuthenticatedRequest,res:Response)=>{try{res.status(201).json({evidence:await service.createEvidence(candidateId(req),req.body,req.user!.id)});}catch(e){fail(res,e)}};
export const update=async(req:AuthenticatedRequest,res:Response)=>{try{res.json({evidence:await service.updateEvidence(candidateId(req),req.params.evidenceId,req.body,req.user!.id)});}catch(e){fail(res,e)}};
export const submit=async(req:AuthenticatedRequest,res:Response)=>{try{res.json({evidence:await service.submitEvidence(candidateId(req),req.params.evidenceId,req.user!.id)});}catch(e){fail(res,e)}};
export const appeal=async(req:AuthenticatedRequest,res:Response)=>{try{res.json({evidence:await service.appealEvidence(candidateId(req),req.params.evidenceId,req.body.reason,req.user!.id)});}catch(e){fail(res,e)}};
export const remove=async(req:AuthenticatedRequest,res:Response)=>{try{await service.deleteEvidence(candidateId(req),req.params.evidenceId,req.user!.id);res.status(204).end();}catch(e){fail(res,e)}};
export const queue=async(req:AuthenticatedRequest,res:Response)=>{try{res.json(await service.reviewQueue(req.query as any));}catch(e){fail(res,e)}};
export const startReview=async(req:AuthenticatedRequest,res:Response)=>{try{res.json({evidence:await service.beginReview(req.params.evidenceId,req.user!.id,req.user!.email)});}catch(e){fail(res,e)}};
export const review=async(req:AuthenticatedRequest,res:Response)=>{try{res.json({evidence:await service.reviewEvidence(req.params.evidenceId,req.user!.id,req.body.decision,req.body.reason,req.body.score)});}catch(e){fail(res,e)}};
export const attachmentIntent=async(req:AuthenticatedRequest,res:Response)=>{try{res.status(201).json(await service.createAttachmentIntent(candidateId(req),req.params.evidenceId,req.body,req.user!.id));}catch(e){fail(res,e)}};
export const attachmentComplete=async(req:AuthenticatedRequest,res:Response)=>{try{res.json({attachment:await service.completeAttachment(candidateId(req),req.params.attachmentId,req.body.scanStatus,req.user!.id)});}catch(e){fail(res,e)}};
export const attachmentDownload=async(req:AuthenticatedRequest,res:Response)=>{try{res.json(await service.getDownload(candidateId(req),req.params.attachmentId));}catch(e){fail(res,e)}};

