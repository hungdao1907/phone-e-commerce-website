const body = $json.body;
const object = value => value && typeof value === 'object' && !Array.isArray(value);
if (!object(body) || typeof body.chatInput !== 'string' || !body.chatInput.trim() || body.chatInput.length > 2000
  || typeof body.sessionId !== 'string' || !body.sessionId.trim() || body.sessionId.length > 100
  || (body.conversationState != null && !object(body.conversationState))
  || (body.conversation_state != null && !object(body.conversation_state))) {
  return {json:{valid:false,result_type:'error',success:false,response:'Invalid chatbot request.',sessionId:typeof body?.sessionId==='string'?body.sessionId.slice(0,100):''}};
}
return {json:{valid:true,chatInput:body.chatInput.trim(),sessionId:body.sessionId,
  source:typeof body.source==='string'?body.source.slice(0,64):'web_chat',
  conversationId:typeof body.conversationId==='string'?body.conversationId.slice(0,100):body.sessionId,
  history:Array.isArray(body.history)?body.history.slice(-6).filter(item=>object(item)&&['user','assistant'].includes(item.role)&&typeof item.content==='string').map(item=>({role:item.role,content:item.content.slice(0,600)})):[],
  conversationState:body.conversationState??body.conversation_state??null}};
