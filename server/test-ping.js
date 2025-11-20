const http = require('http');

function ping(){
  return new Promise((resolve, reject)=>{
    const req = http.get({hostname:'localhost',port:3000,path:'/api/ping',timeout:3000}, res=>{
      let data='';
      res.on('data', chunk=> data+=chunk);
      res.on('end', ()=>{
        try{ const json = JSON.parse(data); resolve({status:res.statusCode, body:json}); }
        catch(e){ resolve({status:res.statusCode, body: data}); }
      });
    });
    req.on('error', err=> reject(err));
    req.on('timeout', ()=>{ req.destroy(); reject(new Error('timeout')); });
  });
}

ping().then(r=>{
  console.log('Ping response:', r);
  process.exit(r && r.status === 200 ? 0 : 1);
}).catch(err=>{ console.error('Ping failed:', err.message); process.exit(2); });
