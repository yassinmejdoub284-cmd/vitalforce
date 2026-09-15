"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { vitalForceIngredients } from "@/lib/product-data";

export function IngredientOrbit({selected,onSelect}:{selected:number;onSelect:(index:number)=>void}){
 const container=useRef<HTMLDivElement>(null);
 const cards=useRef<(HTMLButtonElement|null)[]>([]);
 const angle=useRef(0);
 const [paused,setPaused]=useState(false);
 const [focused,setFocused]=useState(false);
 const reduced=useReducedMotion();
 const manualUntil=useRef(0);
 useEffect(()=>{
   const element=container.current;
   if(!element||paused||focused||reduced)return;
   let visible=false;
   const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting},{threshold:.2});
   observer.observe(element);
   const timer=window.setInterval(()=>{
     if(visible&&!document.hidden&&Date.now()>=manualUntil.current){
       onSelect((selected+1)%vitalForceIngredients.length);
     }
   },4200);
   return()=>{window.clearInterval(timer);observer.disconnect()};
 },[selected,onSelect,paused,focused,reduced]);
 useEffect(()=>{
   const element=container.current;
   if(!element)return;
   let width=element.clientWidth,height=element.clientHeight,frame=0,last=0,visible=true;
   const draw=()=>{
     cards.current.forEach((card,index)=>{
       if(!card)return;
       const a=angle.current+index*Math.PI*2/7-Math.PI/2;
       const depth=(Math.sin(a)+1)/2;
       card.style.left=(width*(.52+.40*Math.cos(a)))+"px";
       card.style.top=(height*(.43+.32*Math.sin(a)))+"px";
       card.style.transform="translate(-50%,-50%) scale("+(0.82+depth*.18)+") rotate("+(Math.cos(a)*7)+"deg)";
       card.style.zIndex=depth>.45?"4":"1";
     });
   };
   const resize=new ResizeObserver(()=>{width=element.clientWidth;height=element.clientHeight;draw()});
   resize.observe(element);
   const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting});
   observer.observe(element);
   const tick=(now:number)=>{
     if(last&&visible&&!document.hidden&&!paused&&!focused&&!reduced)angle.current+=Math.min(now-last,50)/36000*Math.PI*2;
     last=now;draw();frame=requestAnimationFrame(tick);
   };
   draw();
   if(!reduced)frame=requestAnimationFrame(tick);
   return()=>{cancelAnimationFrame(frame);resize.disconnect();observer.disconnect()};
 },[paused,focused,reduced]);
 return <div className="ingredient-orbit" ref={container} onFocusCapture={event=>setFocused((event.target as HTMLElement).classList.contains("orbit-card"))} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocused(false)}}>
   {vitalForceIngredients.map((ingredient,index)=><button key={ingredient.name} type="button" ref={el=>{cards.current[index]=el}} className={"orbit-card"+(selected===index?" is-selected":"")} onClick={()=>{manualUntil.current=Date.now()+6000;onSelect(index)}} aria-pressed={selected===index} aria-label={"Découvrir "+ingredient.name} style={{left:(52+40*Math.cos(index*Math.PI*2/7-Math.PI/2))+"%",top:(43+32*Math.sin(index*Math.PI*2/7-Math.PI/2))+"%"}}><Image src={ingredient.image} alt="" width={160} height={160}/><span>{ingredient.name}</span><small>0{index+1}</small></button>)}
   {!reduced&&<button className="orbit-control" type="button" onClick={()=>setPaused(value=>!value)} aria-label={paused?"Reprendre l’animation des ingrédients":"Mettre l’animation des ingrédients en pause"}>{paused?<Play size={12}/>:<Pause size={12}/>}<span>{paused?"Reprendre":"Pause"}</span></button>}
 </div>;
}
