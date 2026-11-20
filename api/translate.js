function hash(value){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)}

module.exports=async function(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const {text,source='vi',target='en',context='website'}=req.body||{};
  if(!text||source===target)return res.status(200).json({text:text||'',cached:true});
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const modelUrl=process.env.HYMT2_TRANSLATION_API_URL;
  if(!url||!key||!modelUrl)return res.status(500).json({error:'Missing translation configuration'});
  const cacheKey=hash([source,target,context,text].join('|'));
  const headers={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
  const cached=await fetch(url+'/rest/v1/translation_cache?cache_key=eq.'+encodeURIComponent(cacheKey)+'&select=translated_text',{headers}).then(r=>r.ok?r.json():[]).catch(()=>[]);
  if(cached?.[0]?.translated_text)return res.status(200).json({text:cached[0].translated_text,cached:true});
  const model=await fetch(modelUrl,{method:'POST',headers:{'Content-Type':'application/json',...(process.env.HYMT2_API_KEY?{Authorization:'Bearer '+process.env.HYMT2_API_KEY}:{})},body:JSON.stringify({text,source_language:source,target_language:target,source_lang:source,target_lang:target})});
  if(!model.ok)return res.status(502).json({error:'Hy-MT2 translation failed'});
  const body=await model.json();const translated=body.translated_text||body.translation||body.text||body.result;
  if(!translated)return res.status(502).json({error:'Hy-MT2 returned no translation'});
  await fetch(url+'/rest/v1/translation_cache',{method:'POST',headers:{...headers,Prefer:'resolution=merge-duplicates'},body:JSON.stringify({cache_key:cacheKey,source_language:source,target_language:target,source_text:text,translated_text:translated,context})});
  return res.status(200).json({text:translated,cached:false});
};
