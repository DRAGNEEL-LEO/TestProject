const http = require('http');

function request(path, method='GET', body=null){
  return new Promise((resolve, reject)=>{
    const data = body ? JSON.stringify(body) : null;
    const opts = { hostname:'localhost', port:3000, path, method, headers: {} , timeout:5000 };
    if(data){ opts.headers['Content-Type'] = 'application/json'; opts.headers['Content-Length'] = Buffer.byteLength(data); }
    const req = http.request(opts, res=>{
      let buff='';
      res.on('data', c=> buff+=c);
      res.on('end', ()=>{
        let parsed = null;
        try{ parsed = JSON.parse(buff); }catch(e){ parsed = buff; }
        resolve({status: res.statusCode, body: parsed});
      });
    });
    req.on('error', err=> reject(err));
    req.on('timeout', ()=>{ req.destroy(); reject(new Error('timeout')); });
    if(data) req.write(data);
    req.end();
  });
}

(async function(){
  const email = `test+${Date.now()}@example.com`;
  const password = 'Test1234!';
  const name = 'Automated Test';
  console.log('Testing register/login with email:', email);

  try{
    const reg = await request('/api/register','POST',{name,email,password,phone:'000',address:'here'});
    console.log('Register:', reg.status, reg.body);
    if(!(reg.status === 200 || reg.status === 201 || (reg.body && reg.body.ok))) {
      console.error('Register failed');
      process.exit(1);
    }

    const login = await request('/api/login','POST',{email,password});
    console.log('Login:', login.status, login.body);
    if(!(login.status === 200 && login.body && login.body.ok)){
      console.error('Login failed');
      process.exit(1);
    }

    console.log('Auth test succeeded');
    process.exit(0);
  }catch(err){
    console.error('Test error:', err.message);
    process.exit(2);
  }
})();
