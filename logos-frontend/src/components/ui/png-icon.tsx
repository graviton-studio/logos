import React from "react";
import Image from "next/image";

interface PngIconProps {
  src: string;
  alt?: string;
  size?: number | string;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const PngIcon: React.FC<PngIconProps> = ({
  src,
  alt = "Icon",
  size = 24,
  className = "",
  onClick,
  style = {},
}) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={typeof size === "number" ? size : 24}
      height={typeof size === "number" ? size : 24}
      className={`png-icon ${className}`}
      onClick={onClick}
      style={{
        objectFit: "contain",
        display: "inline-block",
        verticalAlign: "middle",
        ...style,
      }}
    />
  );
};

export default PngIcon;
