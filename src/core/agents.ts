import type { ApprovalRequest,RiskLevel,ToolPermission } from './models';
export type ToolName='browser.navigate'|'browser.click'|'browser.extract'|'browser.search'|'browser.tabs'|'workspace.save'|'files.search'|'schools.createActivity'|'agentpay.preparePayment'|'voxa.sendMessage';
export interface ToolContext { agentId:string; tabId?:string; spaceId:string; pageUrl?:string; permissions:ToolPermission[]; }
export interface AgentTool<TInput=unknown,TOutput=unknown> { name:ToolName; risk:RiskLevel; execute(input:TInput,context:ToolContext):Promise<TOutput>; }
const sensitiveTools=new Set<ToolName>(['browser.click','schools.createActivity','agentpay.preparePayment','voxa.sendMessage']);
/** Deny by default. The registry never executes a sensitive action without an approved request. */
export class AgentToolRegistry {
  private tools=new Map<ToolName,AgentTool>();
  private consumedApprovals=new Set<string>();
  register(tool:AgentTool){this.tools.set(tool.name,tool)}
  canAccess(tool:ToolName,context:ToolContext){return context.permissions.some(permission=>permission.tool===tool&&permission.scope!=='none'&&this.scopeAllows(permission,context))}
  async execute(name:ToolName,input:unknown,context:ToolContext,approval?:ApprovalRequest){
    const tool=this.tools.get(name);if(!tool)throw new Error(`Tool ${name} is not registered`);
    if(!this.canAccess(name,context))throw new Error(`Permission denied: ${name}`);
    if(sensitiveTools.has(name)){
      if(!approval||approval.status!=='approved'||approval.agentId!==context.agentId||approval.tool!==name||this.consumedApprovals.has(approval.id))throw new Error(`Approval required: ${name}`);
      this.consumedApprovals.add(approval.id);
    }
    return tool.execute(input,context);
  }
  private scopeAllows(permission:ToolPermission,context:ToolContext){const {scope}=permission;const ids=permission.resourceIds??[];return scope==='always'||(scope==='space'&&ids.includes(context.spaceId))||(scope==='page'&&Boolean(context.pageUrl)&&ids.includes(context.pageUrl!))||(scope==='tab'&&Boolean(context.tabId)&&ids.includes(context.tabId!))||(scope==='selected-tabs'&&Boolean(context.tabId)&&ids.includes(context.tabId!))}
}
export const requiresUserApproval=(action:string)=>/pay|purchas|transfer|message|send|account|delete|executable|security|password/i.test(action);
