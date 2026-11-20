import Image from "next/image";

export function RegistrationNotice() {
  return <div className="registration-notice" lang="ar" dir="rtl">
    <Image src="/images/tunisia.svg" width={24} height={16} alt="" unoptimized />
    <span>منتج مسجّل لدى وزارة الصحة التونسية</span>
  </div>;
}
