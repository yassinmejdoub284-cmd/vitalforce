"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import styles from "./story-gallery.module.css";

const frames = [
  {
    image: "/images/story-origins-v2.webp",
    alt: "Racines, rhizomes et graines disposés sur une pierre sombre",
    kicker: "À la source",
    title: "La nature, au premier plan.",
    copy: "Racines, rhizomes et graines composent notre sélection botanique.",
    imageClass: styles.origins
  },
  {
    image: "/images/story-blend-v2.webp",
    alt: "Ingrédients botaniques suspendus au-dessus d'un bol de pierre",
    kicker: "Le mélange",
    title: "Sept plantes. Une rencontre.",
    copy: "Racines, rhizomes et graines réunis dans un même mélange.",
    imageClass: styles.blend
  },
  {
    image: "/images/story-ingredients-v2.webp",
    alt: "Ingrédients botaniques présentés sur un socle de pierre noire",
    kicker: "La formule",
    title: "Leur richesse, réunie.",
    copy: "De l'ashwagandha au poivre noir, chaque ingrédient trouve sa place.",
    imageClass: styles.stage
  }
];

export function StoryGallery() {
  const reducedMotion = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function goTo(index: number) {
    const next = Math.max(0, Math.min(frames.length - 1, index));
    const frame = track.current?.children[next] as HTMLElement | undefined;
    frame?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "nearest", inline: "start" });
    setActive(next);
  }

  function updateActive() {
    const container = track.current;
    if (!container) return;
    const closest = Array.from(container.children).reduce((result, child, index) => {
      const distance = Math.abs((child as HTMLElement).offsetLeft - container.offsetLeft - container.scrollLeft);
      return distance < result.distance ? { index, distance } : result;
    }, { index: 0, distance: Number.POSITIVE_INFINITY });
    setActive(closest.index);
  }

  return (
    <section className={styles.section} aria-labelledby="story-title">
      <div className="container-shell">
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>VITAL FORCE / LA FORMULE</p>
            <h2 id="story-title">De la nature <em>au rituel.</em></h2>
          </div>
          <Link href="/#ingredients" className={styles.link}>Découvrir les ingrédients <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
      </div>

      <div ref={track} onScroll={updateActive} className={styles.track} aria-label="Trois regards sur la formule VITAL FORCE">
        {frames.map((frame, index) => (
          <motion.figure
            key={frame.image}
            className={styles.frame}
            initial={reducedMotion ? false : { opacity: 0, y: 28 }}
            whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65, delay: index * 0.1 }}
          >
            <div className={styles.imageWrap}>
              <Image src={frame.image} alt={frame.alt} fill sizes="(max-width: 700px) 85vw, (max-width: 1200px) 33vw, 390px" className={`${styles.image} ${frame.imageClass}`} />
            </div>
            <figcaption className={styles.caption}>
              <span className={styles.number}>0{index + 1} <i /> {frame.kicker}</span>
              <h3>{frame.title}</h3>
              <p>{frame.copy}</p>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      <div className={styles.mobileControls}>
        <span aria-live="polite">0{active + 1} / 0{frames.length}</span>
        <div>
          <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Image précédente" title="Image précédente"><ChevronLeft size={20} /></button>
          <button type="button" onClick={() => goTo(active + 1)} disabled={active === frames.length - 1} aria-label="Image suivante" title="Image suivante"><ChevronRight size={20} /></button>
        </div>
      </div>
    </section>
  );
}
