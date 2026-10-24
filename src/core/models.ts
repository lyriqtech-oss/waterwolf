export type PageId = 'newtab'|'settings'|'agents'|'workspace'|'files'|'bookmarks'|'downloads'|'history'|'extensions'|'about'|'billing'|'vault'|'schools'|'voxa'|'modelhub'|'agentpay'|'terminal'|'engine';
export type AIMode = 'off'|'local'|'auto'|'cloud';
export type ProtectionMode = 'standard'|'strict'|'custom';
export type Theme = 'light'|'dark'|'system';
export type AccessScope = 'none'|'page'|'tab'|'selected-tabs'|'space'|'always';
export type RiskLevel = 'low'|'medium'|'high'|'critical';
export type AgentStatus = 'active'|'queued'|'completed'|'needs-approval'|'paused'|'stopped';
export type TabStatus = 'ready'|'loading'|'sleeping'|'agent-controlled';
export interface Tab { id:string; title:string; url:string; page:PageId|null; spaceId:string; status:TabStatus; pinned:boolean; audible:boolean; }
export interface Space { id:string; name:string; color:string; kind:'personal'|'work'|'school'|'finance'|'development'; }
export interface Agent { id:string; name:string; task:string; status:AgentStatus; progress:number; currentSite?:string; tools:string[]; estimatedCost:number; elapsedSeconds:number; permissions:AccessScope; }
export interface ApprovalRequest { id:string; agentId:string; action:string; tool:string; target:string; riskLevel:RiskLevel; summary:string; requestedAt:string; status:'pending'|'approved'|'rejected'; }
export interface AIRequest { id:string; prompt:string; tier:0|1|2|3|4; privacy:'local-only'|'allow-cloud'; estimatedCost:number; }
export interface ToolPermission { tool:string; scope:AccessScope; resourceIds?:string[]; grantedAt?:string; }
export interface SubscriptionPlan { id:'free'|'plus'|'pro'|'business'; name:string; targetPriceBRL:number|null; }
export interface AIUsage { cloudPercent:number; agentTasksUsed:number; agentTasksLimit:number; deepResearchUsed:number; deepResearchLimit:number; }
export interface BrowserProfile { id:string; displayName:string; email?:string; signedIn:boolean; }
export interface BrowserExtension { id:string; name:string; enabled:boolean; pinned:boolean; permissions:string[]; }
export interface BrowserDownload { id:string; name:string; sizeBytes:number; status:'completed'|'downloading'|'failed'; }
export interface Bookmark { id:string; title:string; url:string; spaceId:string; createdAt:string; }
export interface WorkspaceItem { id:string; title:string; kind:'page'|'note'|'document'|'file'; project?:string; }
export const INTERNAL_PAGES: Record<string,PageId> = {newtab:'newtab',settings:'settings',agents:'agents',workspace:'workspace',files:'files',bookmarks:'bookmarks',downloads:'downloads',history:'history',extensions:'extensions',about:'about',billing:'billing',vault:'vault',schools:'schools',voxa:'voxa',modelhub:'modelhub',agentpay:'agentpay',terminal:'terminal',engine:'engine'};
export const pageUrl=(page:PageId)=>`waterwolf://${page}`;
export const parseInternalUrl=(url:string):PageId|null=>{const match=/^waterwolf:\/\/([a-z]+)(?:\/)?$/i.exec(url.trim());return match?INTERNAL_PAGES[match[1]!.toLowerCase()]??null:null};
