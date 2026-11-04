import Image from "next/image";
import styles from "./product-jar.module.css";

const jarFlavors = new Set(["orange", "citron", "menthe"]);

export function ProductJar({ flavor, large = false, image, name }: { flavor: string; large?: boolean; image?: string; name?: string }) {
  const variant = flavor.toLowerCase();
  if (!jarFlavors.has(variant) && image) {
    return <div className={`${styles.photo} ${large ? styles.photoLarge : ""}`}>
      <Image src={image} alt={name ?? flavor} width={large ? 480 : 320} height={large ? 480 : 320} sizes={large ? "(max-width: 800px) 80vw, 480px" : "320px"} />
    </div>;
  }
  return (
    <div className={`${styles.jar} ${large ? styles.large : ""} ${styles[variant] ?? ""}`} role="img" aria-label={`Pot VITAL FORCE goût ${flavor}`}>
      <div className={styles.lid} />
      <div className={styles.originalBody} />
    </div>
  );
}
