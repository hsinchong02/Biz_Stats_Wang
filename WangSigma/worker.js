importScripts('vendor/jstat.min.js','engine.js');
onmessage=e=>{try{postMessage({ok:true,result:WStats.run(e.data.id,e.data.options,e.data.data)});}catch(err){postMessage({ok:false,error:err.message});}};
