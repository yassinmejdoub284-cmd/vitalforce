import styles from "./product-jar.module.css";

export function ProductJar({ flavor, large = false }: { flavor: string; large?: boolean }) {
  const variant = flavor.toLowerCase();
  return (
    <div className={`${styles.jar} ${large ? styles.large : ""} ${styles[variant] ?? ""}`} role="img" aria-label={`Pot VITAL FORCE goût ${flavor}`}>
      <div className={styles.lid} />
      <div className={styles.originalBody} />
    </div>
  );
}
