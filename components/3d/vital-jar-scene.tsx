"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, useTexture } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { ProductJar } from "@/components/commerce/product-jar";

function createFlavorLabel(logo: THREE.Texture, flavor: string) {
 const canvas=document.createElement("canvas");
 canvas.width=2048;canvas.height=1024;
 const ctx=canvas.getContext("2d");
 if(!ctx)return null;
 ctx.fillStyle="#161616";ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.strokeStyle="#d4af37";ctx.lineWidth=12;ctx.strokeRect(60,60,1928,904);
 ctx.fillStyle="#fff";ctx.textAlign="center";
 ctx.font="bold 38px Arial";ctx.fillText("COMPLÉMENT ALIMENTAIRE",1024,130);
 ctx.drawImage(logo.image as CanvasImageSource,710,170,628,410);
 ctx.font="bold 82px Arial";ctx.fillText("VITAL FORCE",1024,610);
 ctx.font="bold 42px Arial";ctx.fillText("7 INGRÉDIENTS BOTANIQUES",1024,700);
 ctx.fillStyle=flavor==="Menthe"?"#91c4a9":"#e3cf75";
 ctx.fillRect(640,750,768,115);
 ctx.fillStyle="#111";ctx.font="bold 54px Arial";ctx.fillText(`GOÛT ${flavor.toUpperCase()}`,1024,826);
 ctx.fillStyle="#fff";ctx.font="32px Arial";ctx.fillText("POIDS NET 400 g",1024,925);
 const texture=new THREE.CanvasTexture(canvas);
 texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 return texture;
}

function JarModel({ interactive=false, still=false, flavor="Orange", angle=0 }: {interactive?:boolean; still?:boolean; flavor?:string; angle?:number}) {
 const label=useTexture(flavor==="Menthe"?"/images/v2/etiquette-menthe.png":"/images/v2/etiquette-orange.png");
 const logo=useTexture("/images/v2/logo.png");
 const flavorLabel=useMemo(()=>flavor==="Citron"?createFlavorLabel(logo,flavor):null,[flavor,logo]);
 useEffect(()=>()=>{flavorLabel?.dispose()},[flavorLabel]);
 const group=useRef<THREE.Group>(null);
 label.colorSpace=THREE.SRGBColorSpace;
 label.anisotropy=4;
 useFrame(({clock,pointer})=>{
   if(!group.current||interactive||still)return;
   group.current.rotation.y=Math.PI+Math.sin(clock.elapsedTime*.25)*.12+pointer.x*.16;
   group.current.rotation.z=-.06+pointer.x*.025;
 });
 return <group ref={group} rotation={[0,Math.PI+angle,-.06]}>
   <mesh castShadow><cylinderGeometry args={[1.15,1.15,2.2,96,1,true]}/><meshStandardMaterial map={flavorLabel??label} roughness={.76}/></mesh>
   <mesh position={[0,1.12,0]} castShadow><cylinderGeometry args={[1.13,1.15,.15,80]}/><meshStandardMaterial color="#edeadb" roughness={.48}/></mesh>
   <mesh position={[0,1.28,0]} castShadow><cylinderGeometry args={[1.2,1.2,.29,96]}/><meshStandardMaterial color="#e9e7d7" roughness={.45}/></mesh>
   <mesh position={[0,1.43,0]}><cylinderGeometry args={[1.17,1.2,.035,96]}/><meshStandardMaterial color="#f7f4e5" roughness={.48}/></mesh>
   {Array.from({length:72},(_,i)=>{const a=i/72*Math.PI*2;return <mesh key={i} position={[Math.sin(a)*1.198,1.28,Math.cos(a)*1.198]} rotation={[0,a,0]}><boxGeometry args={[.015,.22,.018]}/><meshStandardMaterial color="#d2d2c2" roughness={.65}/></mesh>})}
   <mesh position={[0,-1.14,0]}><cylinderGeometry args={[1.15,1.09,.11,80]}/><meshStandardMaterial color="#e7e5d5" roughness={.55}/></mesh>
 </group>;
}
function JarFallback({flavor}:{flavor:string}){return <div className="grid h-full place-items-center"><ProductJar flavor={flavor} large/></div>}
class SceneBoundary extends Component<{children:ReactNode;flavor:string},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<JarFallback flavor={this.props.flavor}/>:this.props.children}
}
export function VitalJarScene({viewer=false,flavor="Orange",angle=0,zoom=6.8}:{viewer?:boolean;flavor?:string;angle?:number;zoom?:number}){
 const reduced=useReducedMotion();
 return <div className="jar-scene"><SceneBoundary flavor={flavor}><Canvas camera={{position:[0,.45,zoom],fov:39}} dpr={[1,1.25]} gl={{alpha:true,antialias:true,powerPreference:"low-power"}}>
   <ambientLight intensity={1.6}/><directionalLight position={[-4,5,6]} intensity={3}/><directionalLight position={[4,2,-3]} intensity={2.3} color="#fff4dc"/>
   <Suspense fallback={null}><Float speed={reduced||viewer?0:1.1} floatIntensity={reduced||viewer?0:.13} rotationIntensity={0}><JarModel interactive={viewer} still={Boolean(reduced)} flavor={flavor} angle={angle}/></Float></Suspense>
   {viewer&&<OrbitControls enablePan={false} minDistance={4.4} maxDistance={9} enableDamping={!reduced}/>}
 </Canvas></SceneBoundary></div>;
}
