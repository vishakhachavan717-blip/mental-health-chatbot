// src/App.jsx
import React, {useState, useEffect} from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL;

export default function App(){
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [token,setToken]=useState(localStorage.getItem("token")||"");
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);

  const login = async () => {
    const res = await fetch(`${API}/auth/login`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({email, password: pass})
    });
    const json = await res.json();
    if(json.access_token){
      localStorage.setItem("token", json.access_token);
      setToken(json.access_token);
      alert("Logged in");
    } else {
      alert("Login failed");
      console.log(json);
    }
  };

  const sendMessage = async () => {
    if(!input.trim()) return;
    setMessages(prev=>[...prev, {sender:"user", text: input}]);
    setInput("");
    setLoading(true);
    try{
      const res = await fetch(`${API}/chat`, {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({message: input})
      });
      const json = await res.json();
      // backend returns saved chat object; adjust based on your response
      const botText = json.response || json.message || "No reply";
      setMessages(prev=>[...prev, {sender:"bot", text: botText}]);
    }catch(err){
      setMessages(prev=>[...prev, {sender:"bot", text:"Error contacting backend"}]);
    }
    setLoading(false);
  };

  return (
    <div style={{textAlign:"center",padding:"40px"}}>
      <h1>Mental Health Chatbot</h1>

      {!token ? (
        <div style={{marginBottom:20}}>
          <h3>Login</h3>
          <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input placeholder="password" value={pass} onChange={e=>setPass(e.target.value)} type="password" />
          <button onClick={login}>Login</button>
          <p>Or sign up via backend /docs → /auth/signup</p>
        </div>
      ) : (
        <div style={{marginBottom:20}}>
          <div>Logged in (token present)</div>
          <button onClick={()=>{ localStorage.removeItem("token"); setToken(""); }}>Logout</button>
        </div>
      )}

      <div style={{maxWidth:720, margin:"0 auto", textAlign:"left"}}>
        <div style={{minHeight:200, border:"1px solid #ddd", padding:10, marginBottom:10}}>
          {messages.map((m,i)=>(
            <div key={i} style={{margin:6, textAlign: m.sender === "user" ? "right":"left"}}>
              <span style={{
                display:"inline-block",
                padding:"8px 12px",
                borderRadius:10,
                background: m.sender === "user" ? "#cfe9ff" : "#eee"
              }}>{m.text}</span>
            </div>
          ))}
          {loading && <div>Bot is typing...</div>}
        </div>

        <input style={{width:"70%"}} value={input} onChange={e=>setInput(e.target.value)}
               onKeyDown={e=>e.key==="Enter" && sendMessage()} placeholder="Type a message..." />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
