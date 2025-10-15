import React from "react";
import Image from "next/image";

const FuneralPolicyBanner = () => {
  return (
    <div className="relative flex rounded-lg overflow-hidden shadow-lg max-w-7xl min-h-[55vh] mx-auto my-8">
      {/* Background Image */}
      <Image
        src="/images/family.jpg"
        alt="Family background"
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        // width={640}
        // height={400}
        className="object-cover object-left"
        priority
      />

      {/* SVG clip-path definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="curveClip" clipPathUnits="objectBoundingBox">
            <path d="M 0.12,0 Q 0.15,0.5 0.02,1 L 1,1 L 1,0 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Left side: Transparent overlay for image visibility */}
      <div className="relative flex-1 z-10"></div>

      {/* Right side: Yellow content with curved left edge */}
      <div
        className="relative flex-none w-3/5 md:w-1/2 bg-[#f7e306]/90 text-white pl-16 p-8 flex items-center justify-end z-10"
        style={{
          clipPath: "url(#curveClip)",
        }}
      >
        <p className="relative z-10 text-xl font-bold leading-tight text-right pr-4">
          With Instant Funeral Cover from Liyana Finance, you can get up to R130
          000 in cover.
        </p>
      </div>
    </div>
  );
};

export default FuneralPolicyBanner;
