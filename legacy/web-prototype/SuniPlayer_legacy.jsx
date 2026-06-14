import { useState, useEffect, useRef, useMemo } from "react";

const TRACKS = [
  {id:"1",title:"Fly Me To The Moon",artist:"Sinatra",duration:190,bpm:120,key:"C",energy:.7,mood:"happy"},
  {id:"2",title:"Besame Mucho",artist:"Bocelli",duration:220,bpm:95,key:"Dm",energy:.5,mood:"melancholic"},
  {id:"3",title:"Perfect",artist:"Ed Sheeran",duration:263,bpm:63,key:"Ab",energy:.6,mood:"calm"},
  {id:"4",title:"La Vie en Rose",artist:"Piaf",duration:200,bpm:78,key:"G",energy:.4,mood:"calm"},
  {id:"5",title:"Autumn Leaves",artist:"Jazz Std",duration:255,bpm:110,key:"Gm",energy:.5,mood:"melancholic"},
  {id:"6",title:"Can't Help Falling in Love",artist:"Elvis",duration:180,bpm:72,key:"C",energy:.4,mood:"calm"},
  {id:"7",title:"All of Me",artist:"John Legend",duration:269,bpm:63,key:"Ab",energy:.5,mood:"calm"},
  {id:"8",title:"Shape of You",artist:"Ed Sheeran",duration:234,bpm:96,key:"C#m",energy:.8,mood:"energetic"},
  {id:"9",title:"Despacito",artist:"Luis Fonsi",duration:228,bpm:89,key:"Bm",energy:.85,mood:"energetic"},
  {id:"10",title:"A Thousand Years",artist:"C. Perri",duration:285,bpm:67,key:"Bb",energy:.35,mood:"calm"},
  {id:"11",title:"My Way",artist:"Sinatra",duration:277,bpm:76,key:"D",energy:.6,mood:"happy"},
  {id:"12",title:"Thinking Out Loud",artist:"Ed Sheeran",duration:281,bpm:79,key:"D",energy:.55,mood:"calm"},
  {id:"13",title:"L-O-V-E",artist:"Nat King Cole",duration:155,bpm:130,key:"G",energy:.75,mood:"happy"},
  {id:"14",title:"Libertango",artist:"Piazzolla",duration:210,bpm:132,key:"Am",energy:.9,mood:"energetic"},
  {id:"15",title:"Cinema Paradiso",artist:"Morricone",duration:240,bpm:60,key:"F",energy:.3,mood:"melancholic"},
  {id:"16",title:"Havana",artist:"C. Cabello",duration:217,bpm:105,key:"Bm",energy:.75,mood:"energetic"},
  {id:"17",title:"Con Te Partiro",artist:"Bocelli",duration:250,bpm:68,key:"Bb",energy:.55,mood:"melancholic"},
  {id:"18",title:"Wonderful World",artist:"Armstrong",duration:140,bpm:72,key:"F",energy:.35,mood:"calm"},
];

const VENUES = [
  {id:"lobby",label:"Lobby",color:"#06B6D4"},
  {id:"dinner",label:"Cena",color:"#8B5CF6"},
  {id:"cocktail",label:"Cocktail",color:"#F59E0B"},
  {id:"event",label:"Evento",color:"#EF4444"},
  {id:"cruise",label:"Crucero",color:"#10B981"},
];

const CURVES = [
  {id:"steady",label:"Estable",desc:"Misma energia"},
  {id:"ascending",label:"Ascendente",desc:"Suave a fuerte"},
  {id:"descending",label:"Descendente",desc:"Fuerte a suave"},
  {id:"wave",label:"Ola",desc:"Sube y baja"},
];

const MOODS = ["happy","calm","melancholic","energetic"];
const fmt = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;
const fmtM = s => {const m=Math.floor(s/60),r=s%60;return r>0?`${m}m ${r}s`:`${m}m`;};
const mc = m => ({happy:"#F59E0B",melancholic:"#6366F1",calm:"#06B6D4",energetic:"#EF4444"})[m]||"#888";
const ec = e => e>.7?"#EF4444":e>.4?"#F59E0B":"#06B6D4";

function genWave(seed,n=100){
  const d=[];let v=.3;
  for(let i=0;i<n;i++){v+=Math.sin(i*.15+seed)*.12+Math.cos(i*.08+seed*2)*.08+(Math.random()-.5)*.15;v=Math.max(.05,Math.min(1,v));d.push(v);}
  return d;
}

function buildSet(repo,target,opts={}){
  const{curve="steady",tol=90,max=20}=opts;
  const mx=target+tol,mn=target-tol;
  let best=null,bd=Infinity;
  for(let a=0;a<300;a++){
    const sh=[...repo].sort(()=>Math.random()-.5),set=[];let tot=0;
    for(const t of sh){if(set.length>=max)break;if(tot+t.duration<=mx){set.push(t);tot+=t.duration;}}
    const d=Math.abs(tot-target);
    if(tot>=mn&&tot<=mx&&d<bd){bd=d;best=[...set];}
  }
  if(!best){best=[];let tot=0;for(const t of[...repo].sort((a,b)=>b.duration-a.duration))if(tot+t.duration<=mx){best.push(t);tot+=t.duration;}}
  if(curve==="ascending")best.sort((a,b)=>a.energy-b.energy);
  else if(curve==="descending")best.sort((a,b)=>b.energy-a.energy);
  else if(curve==="wave"){best.sort((a,b)=>a.energy-b.energy);const m=Math.floor(best.length/2),f=best.slice(0,m),s=best.slice(m).reverse(),w=[];for(let i=0;i<Math.max(f.length,s.length);i++){if(i<f.length)w.push(f[i]);if(i<s.length)w.push(s[i]);}best=w;}
  return best;
}

function Wave({data,progress,color}){
  return <div style={{display:"flex",alignItems:"center",height:52,gap:1,padding:"0 2px"}}>
    {data.map((v,i)=><div key={i} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",height:"100%"}}>
      <div style={{width:"100%",borderRadius:1,height:`${v*100}%`,minHeight:2,backgroundColor:i/data.length<progress?color:"rgba(255,255,255,0.1)",transition:"background-color .15s"}}/>
    </div>)}
  </div>;
}

function TRow({track,idx,showN,onAdd,onRm,active,onClick,small}){
  return <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:10,padding:small?"7px 12px":"9px 14px",borderRadius:8,cursor:onClick?"pointer":"default",backgroundColor:active?"rgba(6,182,212,0.1)":"transparent",borderLeft:active?"3px solid #06B6D4":"3px solid transparent",transition:"all .15s"}}
    onMouseEnter={e=>{if(!active)e.currentTarget.style.backgroundColor="rgba(255,255,255,0.03)";}}
    onMouseLeave={e=>{e.currentTarget.style.backgroundColor=active?"rgba(6,182,212,0.1)":"transparent";}}>
    {showN&&<span style={{fontSize:12,color:active?"#06B6D4":"rgba(255,255,255,0.2)",fontFamily:"'JetBrains Mono',monospace",width:22,textAlign:"right",fontWeight:active?700:400}}>{idx+1}</span>}
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:13,fontWeight:active?600:500,color:active?"#F0F4F8":"#D0D4D8",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{track.title}</div>
      <div style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>{track.artist}</div>
    </div>
    <span style={{fontSize:9,padding:"2px 5px",borderRadius:3,backgroundColor:mc(track.mood)+"18",color:mc(track.mood),fontWeight:600}}>{track.key}</span>
    <div style={{width:30,height:4,borderRadius:2,backgroundColor:"rgba(255,255,255,0.06)",overflow:"hidden"}}><div style={{height:"100%",width:`${track.energy*100}%`,backgroundColor:ec(track.energy),borderRadius:2}}/></div>
    <span style={{fontSize:11,color:"rgba(255,255,255,0.25)",fontFamily:"'JetBrains Mono',monospace",width:36,textAlign:"right"}}>{fmt(track.duration)}</span>
    {onAdd&&<button onClick={e=>{e.stopPropagation();onAdd(track);}} style={{background:"rgba(6,182,212,0.1)",border:"1px solid rgba(6,182,212,0.2)",borderRadius:6,padding:"4px 8px",cursor:"pointer",color:"#06B6D4",fontSize:11,fontWeight:600}}>+</button>}
    {onRm&&<button onClick={e=>{e.stopPropagation();onRm(idx);}} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:6,padding:"3px 7px",cursor:"pointer",color:"#EF4444",fontSize:11}}>x</button>}
  </div>;
}

function Summary({tracks,target}){
  const tot=tracks.reduce((s,t)=>s+t.duration,0);
  const diff=tot-target;
  const dc=Math.abs(diff)<=60?"#10B981":Math.abs(diff)<=180?"#F59E0B":"#EF4444";
  const dl=diff===0?"Exacto":diff>0?"+"+fmtM(diff):"-"+fmtM(Math.abs(diff));
  const ae=tracks.length?tracks.reduce((s,t)=>s+t.energy,0)/tracks.length:0;
  return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,padding:"12px 14px",borderRadius:10,backgroundColor:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)"}}>
    <div><div style={{fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1}}>Duracion</div><div style={{fontSize:16,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{fmtM(tot)}</div></div>
    <div><div style={{fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1}}>vs Objetivo</div><div style={{fontSize:16,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:dc}}>{dl}</div></div>
    <div><div style={{fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1}}>Tracks</div><div style={{fontSize:16,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{tracks.length}</div></div>
    <div><div style={{fontSize:9,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1}}>Energia</div><div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}><div style={{flex:1,height:5,borderRadius:3,backgroundColor:"rgba(255,255,255,0.06)",overflow:"hidden"}}><div style={{height:"100%",width:`${ae*100}%`,borderRadius:3,background:"linear-gradient(90deg,#06B6D4,#F59E0B,#EF4444)"}}/></div><span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:"rgba(255,255,255,0.4)"}}>{(ae*10).toFixed(1)}</span></div></div>
  </div>;
}

export default function App(){
  const[view,setView]=useState("builder");
  const[targetMin,setTargetMin]=useState(45);
  const[venue,setVenue]=useState("lobby");
  const[curve,setCurve]=useState("steady");
  const[genSet,setGenSet]=useState([]);
  const[search,setSearch]=useState("");
  const[fMood,setFMood]=useState(null);
  const[history,setHistory]=useState([]);
  const[pQueue,setPQueue]=useState([]);
  const[ci,setCi]=useState(0);
  const[playing,setPlaying]=useState(false);
  const[pos,setPos]=useState(0);
  const[vol,setVol]=useState(.85);
  const[elapsed,setElapsed]=useState(0);
  const[tTarget,setTTarget]=useState(2700);
  const[mode,setMode]=useState("edit");
  const[waves]=useState(()=>TRACKS.map((_,i)=>genWave(i*7)));
  const iRef=useRef(null);
  const tRef=useRef(null);

  const tSec=targetMin*60;
  const ct=pQueue[ci];
  const prog=ct?pos/(ct.duration*1000):0;
  const qTot=pQueue.reduce((s,t)=>s+t.duration,0);
  const mCol=mode==="live"?"#06B6D4":"#8B5CF6";

  const filtered=useMemo(()=>TRACKS.filter(t=>{
    if(search&&!t.title.toLowerCase().includes(search.toLowerCase())&&!t.artist.toLowerCase().includes(search.toLowerCase()))return false;
    if(fMood&&t.mood!==fMood)return false;
    if(genSet.find(s=>s.id===t.id))return false;
    return true;
  }),[search,fMood,genSet]);

  useEffect(()=>{
    if(playing&&ct){
      iRef.current=setInterval(()=>{
        setPos(p=>{
          if(p+250>=ct.duration*1000){if(ci<pQueue.length-1){setCi(i=>i+1);return 0;}else{setPlaying(false);return ct.duration*1000;}}
          return p+250;
        });
      },250);
    }
    return()=>clearInterval(iRef.current);
  },[playing,ci,ct,pQueue.length]);

  useEffect(()=>{
    if(playing){tRef.current=setInterval(()=>setElapsed(p=>p+1),1000);}
    return()=>clearInterval(tRef.current);
  },[playing]);

  useEffect(()=>{
    const h=e=>{
      if(e.key===" "&&view==="player"){e.preventDefault();setPlaying(p=>!p);}
      if(e.key==="ArrowRight"&&view==="player"&&ci<pQueue.length-1){setCi(i=>i+1);setPos(0);}
      if(e.key==="ArrowLeft"&&view==="player"&&ci>0){setCi(i=>i-1);setPos(0);}
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[view,ci,pQueue.length]);

  const doGen=()=>setGenSet(buildSet(TRACKS,tSec,{curve,tol:90}));
  const toPlayer=()=>{if(!genSet.length)return;setPQueue([...genSet]);setCi(0);setPos(0);setPlaying(false);setElapsed(0);setTTarget(tSec);setMode("edit");setView("player");};
  const saveSet=()=>{if(!genSet.length)return;const v=VENUES.find(x=>x.id===venue);setHistory(p=>[{id:Date.now()+"",name:(v?.label||"Set")+" "+targetMin+"min",tracks:[...genSet],total:genSet.reduce((s,t)=>s+t.duration,0),target:tSec,venue,curve,date:new Date().toLocaleString()},...p]);};
  const seek=e=>{if(!ct)return;const r=e.currentTarget.getBoundingClientRect();setPos(Math.floor(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*ct.duration*1000));};

  const rem=Math.max(0,tTarget-elapsed);
  const tPct=tTarget>0?Math.min(1,elapsed/tTarget):0;
  const tCol=rem<120&&rem>0?"#EF4444":rem<300&&rem>0?"#F59E0B":"#06B6D4";

  const navBtn=(id,label)=><button key={id} onClick={()=>setView(id)} style={{padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",backgroundColor:view===id?"rgba(6,182,212,0.15)":"rgba(255,255,255,0.03)",color:view===id?"#06B6D4":"rgba(255,255,255,0.4)",fontSize:12,fontWeight:600}}>{label}{id==="player"&&pQueue.length>0&&<span style={{marginLeft:4,fontSize:9,padding:"1px 5px",borderRadius:10,backgroundColor:"rgba(6,182,212,0.2)",color:"#06B6D4"}}>{pQueue.length}</span>}</button>;

  return <div style={{minHeight:"100vh",backgroundColor:"#0A0E14",fontFamily:"'DM Sans',-apple-system,sans-serif",color:"#F0F4F8",display:"flex",flexDirection:"column"}}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet"/>

    <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 24px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:28,height:28,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#06B6D4,#8B5CF6)"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
        </div>
        <span style={{fontSize:14,fontWeight:600}}>SuniPlayer</span>
      </div>
      <div style={{display:"flex",gap:4}}>
        {navBtn("builder","Builder")}{navBtn("player","Player")}{navBtn("history","Historial")}
      </div>
    </header>

    {/* ===== BUILDER ===== */}
    {view==="builder"&&<div style={{flex:1,display:"flex",overflow:"hidden"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"18px 22px",overflow:"auto"}}>
        <h2 style={{fontSize:17,fontWeight:700,margin:"0 0 14px"}}>Configuracion del Set</h2>

        <div style={{marginBottom:12}}>
          <label style={{fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1}}>Duracion</label>
          <div style={{display:"flex",gap:6,marginTop:6}}>
            {[30,45,60,90,120].map(m=><button key={m} onClick={()=>setTargetMin(m)} style={{padding:"7px 14px",borderRadius:7,cursor:"pointer",border:`1px solid ${targetMin===m?"#06B6D4":"rgba(255,255,255,0.08)"}`,backgroundColor:targetMin===m?"rgba(6,182,212,0.15)":"rgba(255,255,255,0.02)",color:targetMin===m?"#06B6D4":"rgba(255,255,255,0.5)",fontWeight:600,fontSize:13,fontFamily:"'JetBrains Mono',monospace"}}>{m}min</button>)}
          </div>
        </div>

        <div style={{marginBottom:12}}>
          <label style={{fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1}}>Venue</label>
          <div style={{display:"flex",gap:6,marginTop:6}}>
            {VENUES.map(v=><button key={v.id} onClick={()=>setVenue(v.id)} style={{padding:"7px 12px",borderRadius:7,cursor:"pointer",border:`1px solid ${venue===v.id?v.color+"60":"rgba(255,255,255,0.08)"}`,backgroundColor:venue===v.id?v.color+"18":"rgba(255,255,255,0.02)",color:venue===v.id?v.color:"rgba(255,255,255,0.5)",fontWeight:500,fontSize:12}}>{v.label}</button>)}
          </div>
        </div>

        <div style={{marginBottom:16}}>
          <label style={{fontSize:10,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1}}>Energia</label>
          <div style={{display:"flex",gap:6,marginTop:6}}>
            {CURVES.map(c=><button key={c.id} onClick={()=>setCurve(c.id)} style={{padding:"8px 12px",borderRadius:7,cursor:"pointer",flex:1,border:`1px solid ${curve===c.id?"#8B5CF660":"rgba(255,255,255,0.08)"}`,backgroundColor:curve===c.id?"rgba(139,92,246,0.12)":"rgba(255,255,255,0.02)",color:curve===c.id?"#8B5CF6":"rgba(255,255,255,0.5)",fontWeight:500,fontSize:12,textAlign:"center"}}><div style={{fontSize:11}}>{c.label}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.2)",marginTop:2}}>{c.desc}</div></button>)}
          </div>
        </div>

        {/* GENERATE BUTTON */}
        <div style={{position:"relative",borderRadius:12,padding:2,background:"linear-gradient(135deg,#06B6D4,#8B5CF6,#EC4899)",marginBottom:16}}>
          <button onClick={doGen} style={{width:"100%",padding:"14px 24px",borderRadius:10,border:"none",cursor:"pointer",backgroundColor:"#0A0E14",color:"white",fontSize:15,fontWeight:700,letterSpacing:.3,display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"background-color .2s"}}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor="#0F1520"}
            onMouseLeave={e=>e.currentTarget.style.backgroundColor="#0A0E14"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#grd)" strokeWidth="2.5" strokeLinecap="round"><defs><linearGradient id="grd" x1="0" y1="0" x2="24" y2="24"><stop offset="0%" stopColor="#06B6D4"/><stop offset="100%" stopColor="#EC4899"/></linearGradient></defs><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            Generar Set de {targetMin} minutos
          </button>
        </div>

        {genSet.length>0&&<div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <h2 style={{fontSize:15,fontWeight:700,margin:0}}>Set Generado</h2>
            <div style={{display:"flex",gap:6}}>
              <button onClick={doGen} style={{padding:"5px 10px",borderRadius:6,border:"1px solid rgba(255,255,255,0.08)",backgroundColor:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.5)",fontSize:10,cursor:"pointer"}}>Regenerar</button>
              <button onClick={saveSet} style={{padding:"5px 10px",borderRadius:6,border:"1px solid rgba(16,185,129,0.3)",backgroundColor:"rgba(16,185,129,0.1)",color:"#10B981",fontSize:10,cursor:"pointer",fontWeight:600}}>Guardar</button>
              <button onClick={toPlayer} style={{padding:"5px 12px",borderRadius:6,border:"none",background:"linear-gradient(135deg,#06B6D4,#0891B2)",color:"white",fontSize:10,cursor:"pointer",fontWeight:700,boxShadow:"0 2px 8px rgba(6,182,212,0.3)"}}>Enviar al Player</button>
            </div>
          </div>
          <Summary tracks={genSet} target={tSec}/>
          <div style={{marginTop:8,borderRadius:8,border:"1px solid rgba(255,255,255,0.04)",overflow:"hidden"}}>
            {genSet.map((t,i)=><TRow key={t.id+i} track={t} idx={i} showN onRm={j=>setGenSet(p=>p.filter((_,k)=>k!==j))}/>)}
          </div>
        </div>}

        {!genSet.length&&<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",opacity:.25,fontSize:13}}>Configura y presiona Generar</div>}
      </div>

      <div style={{width:320,borderLeft:"1px solid rgba(255,255,255,0.04)",display:"flex",flexDirection:"column",backgroundColor:"rgba(0,0,0,0.15)"}}>
        <div style={{padding:"12px 14px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.5)"}}>REPERTORIO</span><span style={{fontSize:10,color:"rgba(255,255,255,0.2)"}}>{filtered.length}</span></div>
          <input type="text" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",padding:"6px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,0.08)",backgroundColor:"rgba(255,255,255,0.03)",color:"#F0F4F8",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
          <div style={{display:"flex",gap:3,marginTop:6}}>
            <button onClick={()=>setFMood(null)} style={{padding:"3px 7px",borderRadius:5,border:"none",cursor:"pointer",backgroundColor:!fMood?"rgba(255,255,255,0.08)":"transparent",color:!fMood?"#F0F4F8":"rgba(255,255,255,0.3)",fontSize:10}}>All</button>
            {MOODS.map(m=><button key={m} onClick={()=>setFMood(fMood===m?null:m)} style={{padding:"3px 7px",borderRadius:5,border:"none",cursor:"pointer",backgroundColor:fMood===m?mc(m)+"20":"transparent",color:fMood===m?mc(m):"rgba(255,255,255,0.3)",fontSize:10,textTransform:"capitalize"}}>{m}</button>)}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:4}}>{filtered.map(t=><TRow key={t.id} track={t} small onAdd={tr=>setGenSet(p=>[...p,tr])}/>)}</div>
      </div>
    </div>}

    {/* ===== PLAYER ===== */}
    {view==="player"&&<div style={{flex:1,display:"flex",overflow:"hidden"}}>
      {!pQueue.length?<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,opacity:.4}}>
        <div style={{fontSize:40}}>&#9835;</div>
        <p style={{fontSize:14}}>No hay set cargado</p>
        <button onClick={()=>setView("builder")} style={{padding:"8px 18px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#06B6D4,#8B5CF6)",color:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}>Ir al Builder</button>
      </div>:<>
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"18px 22px",minWidth:0}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
          <div style={{flex:1,minWidth:0}}>
            <h1 style={{fontSize:24,fontWeight:700,margin:0,letterSpacing:-.5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ct?.title||"--"}</h1>
            <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",margin:"2px 0 0"}}>{ct?.artist}</p>
            <div style={{display:"flex",gap:6,marginTop:8}}>
              {ct&&<><span style={{fontSize:10,padding:"2px 6px",borderRadius:4,backgroundColor:"rgba(6,182,212,0.1)",color:"#06B6D4",fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{ct.bpm}BPM</span><span style={{fontSize:10,padding:"2px 6px",borderRadius:4,backgroundColor:"rgba(139,92,246,0.1)",color:"#8B5CF6",fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{ct.key}</span><span style={{fontSize:10,padding:"2px 6px",borderRadius:4,backgroundColor:mc(ct.mood)+"15",color:mc(ct.mood),fontWeight:600,textTransform:"capitalize"}}>{ct.mood}</span></>}
            </div>
          </div>
          {/* Timer */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={{position:"relative",width:76,height:76}}>
              <svg width="76" height="76" viewBox="0 0 76 76" style={{transform:"rotate(-90deg)"}}><circle cx="38" cy="38" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/><circle cx="38" cy="38" r="32" fill="none" stroke={tCol} strokeWidth="4" strokeDasharray={`${2*Math.PI*32}`} strokeDashoffset={`${2*Math.PI*32*(1-tPct)}`} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear,stroke .5s"}}/></svg>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:tCol}}>{fmt(rem)}</span><span style={{fontSize:8,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:1}}>left</span></div>
            </div>
            <span style={{fontSize:9,color:"rgba(255,255,255,0.2)",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(elapsed)}/{fmt(tTarget)}</span>
          </div>
        </div>

        {/* Waveform */}
        <div onClick={seek} style={{cursor:"pointer",borderRadius:8,padding:"6px 4px",backgroundColor:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)",position:"relative",marginBottom:6}}>
          <Wave data={waves[TRACKS.findIndex(t=>t.id===ct?.id)]||waves[0]} progress={prog} color={mCol}/>
          <div style={{position:"absolute",top:3,bottom:3,left:`${prog*100}%`,width:2,backgroundColor:mCol,borderRadius:1,boxShadow:`0 0 8px ${mCol}80`,transition:"left .25s linear"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:20,padding:"0 4px"}}><span>{fmt(Math.floor(pos/1000))}</span><span>-{fmt(Math.max(0,(ct?.duration||0)-Math.floor(pos/1000)))}</span></div>

        {/* Controls */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:18,marginBottom:20}}>
          <button onClick={()=>{if(ci>0){setCi(ci-1);setPos(0);}}} style={{background:"none",border:"none",cursor:"pointer",padding:6,opacity:ci>0?.5:.15}}><svg width="24" height="24" viewBox="0 0 24 24" fill="#F0F4F8"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
          <button onClick={()=>setPlaying(!playing)} style={{width:60,height:60,borderRadius:"50%",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${mCol},${mode==="live"?"#0891B2":"#7C3AED"})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:playing?`0 0 24px ${mCol}50`:"0 4px 16px rgba(0,0,0,0.3)"}}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.06)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            {playing?<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>:<svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{marginLeft:2}}><path d="M8 5v14l11-7z"/></svg>}
          </button>
          <button onClick={()=>{if(ci<pQueue.length-1){setCi(ci+1);setPos(0);}}} style={{background:"none",border:"none",cursor:"pointer",padding:6,opacity:ci<pQueue.length-1?.5:.15}}><svg width="24" height="24" viewBox="0 0 24 24" fill="#F0F4F8"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
        </div>

        {/* Volume + Set bar */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:14}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.2)"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          <input type="range" min="0" max="100" value={Math.round(vol*100)} onChange={e=>setVol(e.target.value/100)} style={{width:120,appearance:"none",height:3,borderRadius:2,background:`linear-gradient(to right,${mCol} ${vol*100}%,rgba(255,255,255,0.08) ${vol*100}%)`,outline:"none",cursor:"pointer"}}/>
          <span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:"rgba(255,255,255,0.2)",width:28}}>{Math.round(vol*100)}%</span>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,backgroundColor:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)"}}>
          <div style={{flex:1}}><div style={{fontSize:9,color:"rgba(255,255,255,0.2)",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Set</div><div style={{height:3,borderRadius:2,backgroundColor:"rgba(255,255,255,0.06)",overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,width:`${Math.min(100,(pQueue.slice(0,ci).reduce((s,t)=>s+t.duration,0)+Math.floor(pos/1000))/qTot*100)}%`,background:`linear-gradient(90deg,${mCol},#8B5CF6)`,transition:"width .5s"}}/></div></div>
          <div style={{textAlign:"right"}}><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:mCol}}>{fmtM(qTot)}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.2)"}}>{pQueue.length} tracks</div></div>
        </div>

        <div style={{marginTop:8,display:"flex",justifyContent:"center"}}>
          <button onClick={()=>setMode(m=>m==="edit"?"live":"edit")} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 14px",borderRadius:20,cursor:"pointer",backgroundColor:mCol+"18",border:`1px solid ${mCol}40`}}>
            <div style={{width:6,height:6,borderRadius:"50%",backgroundColor:mCol,animation:mode==="live"&&playing?"pulse 2s infinite":"none"}}/><span style={{fontSize:11,color:mCol,fontWeight:600}}>{mode==="live"?"LIVE":"EDIT"}</span>
          </button>
        </div>
      </div>

      {/* Queue sidebar */}
      <div style={{width:300,borderLeft:"1px solid rgba(255,255,255,0.04)",display:"flex",flexDirection:"column",backgroundColor:"rgba(0,0,0,0.15)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
          <span style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)"}}>QUEUE{mode==="live"?" (locked)":""}</span>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:mCol}}>{fmtM(qTot)}</span>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:4}}>{pQueue.map((t,i)=><TRow key={t.id+i} track={t} idx={i} showN active={i===ci} onClick={()=>{setCi(i);setPos(0);}}/>)}</div>
        {ci<pQueue.length-1&&<div style={{padding:"8px 14px",borderTop:"1px solid rgba(255,255,255,0.04)",backgroundColor:`${mCol}06`}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.2)",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Next</div>
          <div style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.6)"}}>{pQueue[ci+1]?.title}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.2)"}}>{pQueue[ci+1]?.artist} - {fmt(pQueue[ci+1]?.duration)}</div>
        </div>}
      </div>
      </>}
    </div>}

    {/* ===== HISTORY ===== */}
    {view==="history"&&<div style={{flex:1,padding:"18px 24px",overflow:"auto"}}>
      <h2 style={{fontSize:17,fontWeight:700,margin:"0 0 14px"}}>Historial</h2>
      {!history.length?<div style={{textAlign:"center",padding:50,color:"rgba(255,255,255,0.2)",fontSize:13}}>Genera y guarda sets desde el Builder</div>
      :history.map(s=><div key={s.id} style={{padding:"12px 16px",borderRadius:10,backgroundColor:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <div><h3 style={{margin:0,fontSize:14,fontWeight:600}}>{s.name}</h3><span style={{fontSize:10,color:"rgba(255,255,255,0.2)"}}>{s.date}</span></div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,color:"#06B6D4"}}>{fmtM(s.total)}</span>
            <button onClick={()=>{setGenSet(s.tracks);setTargetMin(s.target/60);setVenue(s.venue);setCurve(s.curve);setView("builder");}} style={{padding:"4px 10px",borderRadius:6,border:"1px solid rgba(6,182,212,0.3)",backgroundColor:"rgba(6,182,212,0.1)",color:"#06B6D4",fontSize:10,cursor:"pointer",fontWeight:600}}>Editar</button>
            <button onClick={()=>{setPQueue(s.tracks);setCi(0);setPos(0);setTTarget(s.target);setElapsed(0);setView("player");}} style={{padding:"4px 10px",borderRadius:6,border:"none",background:"linear-gradient(135deg,#06B6D4,#0891B2)",color:"white",fontSize:10,cursor:"pointer",fontWeight:700}}>Play</button>
          </div>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{s.tracks.map((t,i)=><span key={i} style={{fontSize:9,padding:"2px 6px",borderRadius:4,backgroundColor:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.35)"}}>{t.title} ({fmt(t.duration)})</span>)}</div>
      </div>)}
    </div>}

    <style>{`
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      input[type="range"]::-webkit-slider-thumb{appearance:none;width:12px;height:12px;border-radius:50%;background:#06B6D4;cursor:pointer;border:2px solid #0A0E14}
      div::-webkit-scrollbar{width:4px}div::-webkit-scrollbar-track{background:transparent}div::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
      input::placeholder{color:rgba(255,255,255,0.2)}
    `}</style>
  </div>;
}
