import Image from "next/image";

export function PhotoBrandMark() {
  return <span className="photo-brand-mark" aria-hidden="true"><Image src="/images/v2/logo.png" alt="" width={513} height={333} sizes="92px" /></span>;
}
