import Image from "next/image";
import styles from "./product-jar.module.css";

export function ProductJar({ flavor, large = false }: { flavor: string; large?: boolean }) {
  const variant = flavor.toLowerCase();
  return (
    <div className={`${styles.jar} ${large ? styles.large : ""} ${styles[variant] ?? ""}`} role="img" aria-label={`Pot VITAL FORCE goût ${flavor}`}>
      <div className={styles.lid} />
      {variant === "orange" ? (
        <div className={styles.originalBody} />
      ) : (
        <div className={styles.variantBody}>
          <span>COMPLÉMENT ALIMENTAIRE</span>
          <Image src="/images/v2/logo.png" alt="" width={200} height={135} className={styles.logo} />
          <strong>VITAL FORCE</strong>
          <small>7 INGRÉDIENTS BOTANIQUES</small>
          <b>GOÛT {flavor.toUpperCase()}</b>
          <span>POIDS NET 400 g</span>
        </div>
      )}
    </div>
  );
}
