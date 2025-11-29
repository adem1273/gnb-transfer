import React, { useEffect, useState } from 'react';
import axios from 'axios';
export default function AdminPage(){ const [users,setUsers]=useState([]); useEffect(()=>{ axios.get((import.meta.env.VITE_API_URL||'/api')+'/admin/users').then(r=>setUsers(r.data.users)); },[]); return (<div><h2>Admin</h2><ul>{users.map(u=> <li key={u._id}>{u.email} ({u.role})</li>)}</ul></div>); }
