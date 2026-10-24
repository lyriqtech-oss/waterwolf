import { describe,expect,it } from 'vitest';
import { routeAIRequest } from './ai';
import { parseInternalUrl } from './models';
const request={id:'1',prompt:'summarize',tier:1 as const,privacy:'local-only' as const,estimatedCost:0};
describe('routing',()=>{it('keeps Classic Mode model-free',()=>{expect(routeAIRequest(request,'off',true,10).target).toBe('deterministic')});it('uses local model when available',()=>{expect(routeAIRequest(request,'local',true,10).target).toBe('local')});it('never routes local-only work to cloud',()=>{expect(routeAIRequest(request,'auto',false,10).target).toBe('deterministic')});it('recognizes only declared internal pages',()=>{expect(parseInternalUrl('waterwolf://settings')).toBe('settings');expect(parseInternalUrl('waterwolf://unknown')).toBeNull()})});
