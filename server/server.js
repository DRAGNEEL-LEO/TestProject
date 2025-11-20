const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'users.json');

function readUsers(){
  try{ const raw = fs.readFileSync(DATA_FILE,'utf8'); return JSON.parse(raw||'[]'); }
  catch(e){ return []; }
}
function writeUsers(users){ fs.writeFileSync(DATA_FILE, JSON.stringify(users,null,2),'utf8'); }

app.get('/api/ping', (req,res)=> res.json({ok:true,now:Date.now()}));

app.post('/api/register', async (req,res)=>{
  const {name,email,password,phone,address} = req.body || {};
  if(!name||!email||!password) return res.status(400).json({error:'name,email,password required'});
  const users = readUsers();
  if(users.find(u=>u.email===email.toLowerCase())) return res.status(409).json({error:'email_exists'});
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const user = { id: Date.now(), name, email: email.toLowerCase(), phone: phone||'', address: address||'', passwordHash: hash, created: new Date().toISOString() };
  users.push(user);
  writeUsers(users);
  const {passwordHash, ...safe} = user;
  res.json({ok:true,user:safe});
});

app.post('/api/login', async (req,res)=>{
  const {email,password} = req.body || {};
  if(!email||!password) return res.status(400).json({error:'email_password_required'});
  const users = readUsers();
  const user = users.find(u=>u.email===email.toLowerCase());
  if(!user) return res.status(404).json({error:'no_user'});
  const match = await bcrypt.compare(password, user.passwordHash);
  if(!match) return res.status(401).json({error:'invalid_password'});
  const {passwordHash, ...safe} = user;
  res.json({ok:true,user:safe});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`EdLearn demo backend running on http://localhost:${PORT}`));
