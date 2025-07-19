'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './map.module.css';

declare global {
  interface Window {
    kakao: any;
  }
}

export default function MapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const mapRef = useRef<HTMLDivElement>(null);

  const goBack = () => {
    router.push('/');
  };

  // 웹에서는 접속을 막고 개발 중 메시지 표시
  return (
    <div className={styles.container}>
      {/* 배경 이미지 */}
      <div 
        className={styles.backgroundImage}
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80)'
        }}
      >
        {/* 오버레이 그라데이션 */}
        <div className={styles.overlay}>
          {/* 헤더 */}
          <div className={styles.header}>
            <button 
              className={styles.backButton} 
              onClick={goBack}
            >
              ← 뒤로
            </button>
            <h1 className={styles.title}>카카오지도</h1>
            {roomId && <span className={styles.roomId}>방 ID: {roomId}</span>}
          </div>
          
          {/* 개발 중 메시지 */}
          <div className={styles.developmentMessage}>
            <h2 className={styles.developmentTitle}>🚧 개발 중입니다!</h2>
            <p className={styles.developmentText}>
              카카오지도 기능은 현재 개발 중입니다.
              <br />
              나중에 완성되면 여기에 지도가 표시될 예정입니다.
            </p>
            <div className={styles.developmentInfo}>
              <p>📱 모바일 앱에서는 정상 작동할 예정입니다.</p>
              <p>🌐 웹에서는 현재 개발 중인 상태입니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 아래는 실제 카카오지도 코드 (현재는 주석 처리)
  /*
  useEffect(() => {
    // 카카오지도 API 스크립트 로드
    const loadKakaoMap = () => {
      if (window.kakao && window.kakao.maps) {
        // API가 이미 로드된 경우
        window.kakao.maps.load(() => {
          initMap();
        });
      } else {
        const script = document.createElement('script');
        const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || '07b8ff7ced4732d58db45786c59dd88e';
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
        script.onload = () => {
          // API가 로드된 후 kakao.maps.load() 호출
          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
              initMap();
            });
          }
        };
        document.head.appendChild(script);
      }
    };

    const initMap = () => {
      if (!mapRef.current || !window.kakao || !window.kakao.maps) {
        console.log('카카오지도 API가 로드되지 않았습니다.');
        return;
      }

      try {
        const mapContainer = mapRef.current;
        const mapOption = { 
          center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울시청
          level: 3 // 지도의 확대 레벨
        };

        // 지도를 표시할 div와 지도 옵션으로 지도를 생성합니다
        const map = new window.kakao.maps.Map(mapContainer, mapOption);
        
        // 마커 추가
        const markerPosition = new window.kakao.maps.LatLng(37.5665, 126.9780);
        const marker = new window.kakao.maps.Marker({
          position: markerPosition
        });
        marker.setMap(map);

        // 인포윈도우 추가
        const infowindow = new window.kakao.maps.InfoWindow({
          content: '<div style="padding:5px;font-size:12px;">서울시청</div>'
        });
        infowindow.open(map, marker);

        // 지도 클릭 이벤트
        window.kakao.maps.event.addListener(map, 'click', function(mouseEvent: any) {
          const latlng = mouseEvent.latLng;
          console.log('클릭한 위치:', latlng.getLat(), latlng.getLng());
          
          // 클릭한 위치에 마커 추가
          const newMarker = new window.kakao.maps.Marker({
            position: latlng
          });
          newMarker.setMap(map);
        });

        console.log('카카오지도가 성공적으로 로드되었습니다.');
      } catch (error) {
        console.error('카카오지도 초기화 중 오류 발생:', error);
      }
    };

    loadKakaoMap();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton} 
          onClick={goBack}
        >
          ← 뒤로
        </button>
        <h1 className={styles.title}>카카오지도</h1>
        {roomId && <span className={styles.roomId}>방 ID: {roomId}</span>}
      </div>
      
      <div className={styles.mapContainer}>
        <div 
          ref={mapRef}
          className={styles.map}
        />
      </div>
    </div>
  );
  */
}