"use client";
import React, { useEffect, useRef } from "react";

interface KakaoMapProps {
  onLocationChange?: (lat: number, lng: number) => void;
}

const KakaoMap = ({ onLocationChange }: KakaoMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function createMapAndMarker() {
      // @ts-ignore
      const kakao = window.kakao;
      if (mapRef.current && !mapInstance.current) {
        mapInstance.current = new kakao.maps.Map(mapRef.current, {
          center: new kakao.maps.LatLng(37.5665, 126.9780),
          level: 3,
        });
      }
      if (mapInstance.current && !markerInstance.current) {
        markerInstance.current = new kakao.maps.Marker({
          position: mapInstance.current.getCenter(),
          map: mapInstance.current,
        });
      }
      // 지도 이동 시 마커도 중심으로 이동
      if (mapInstance.current && markerInstance.current) {
        kakao.maps.event.addListener(mapInstance.current, 'center_changed', function() {
          markerInstance.current.setPosition(mapInstance.current.getCenter());
        });
      }
    }

    if (document.getElementById("kakao-map-script")) {
      // 이미 스크립트가 있으면 바로 지도/마커 로드
      // @ts-ignore
      if (window.kakao && window.kakao.maps) {
        createMapAndMarker();
      }
      return;
    }
    const script = document.createElement("script");
    script.id = "kakao-map-script";
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      window.kakao.maps.load(() => {
        createMapAndMarker();
      });
    };
    document.head.appendChild(script);
    // eslint-disable-next-line
  }, []);

  // GPS 버튼 클릭 시 현재 위치로 이동
  const handleGpsClick = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 추적이 지원되지 않습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // @ts-ignore
        if (window.kakao && window.kakao.maps && mapInstance.current) {
          // @ts-ignore
          const moveLatLng = new window.kakao.maps.LatLng(lat, lng);
          mapInstance.current.setCenter(moveLatLng);
          // 부모 콜백 호출
          if (onLocationChange) onLocationChange(lat, lng);
        }
      },
      (err) => {
        alert("위치 정보를 가져올 수 없습니다.");
      }
    );
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "250px", margin: "16px 0" }}>
      <div
        ref={mapRef}
        style={{ width: "100%", height: "100%", borderRadius: "10px" }}
      />
      {/* GPS 버튼 */}
      <button
        onClick={handleGpsClick}
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          zIndex: 10,
          background: "#fff",
          border: "1px solid #8B4513",
          borderRadius: "50%",
          width: 48,
          height: 48,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        title="현재 위치로 이동"
      >
        <span role="img" aria-label="gps">📍</span>
      </button>
    </div>
  );
};

export default KakaoMap; 