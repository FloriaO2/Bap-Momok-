"use client";
import React, { useEffect, useRef } from "react";

const KakaoMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 이미 스크립트가 있으면 중복 삽입 방지
    if (typeof window === "undefined" || document.getElementById("kakao-map-script")) return;
    const script = document.createElement("script");
    script.id = "kakao-map-script";
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      window.kakao.maps.load(() => {
        // @ts-ignore
        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 기준
          level: 3,
        });
      });
    };
    document.head.appendChild(script);
    // eslint-disable-next-line
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "250px", borderRadius: "10px", margin: "16px 0" }}
    />
  );
};

export default KakaoMap; 