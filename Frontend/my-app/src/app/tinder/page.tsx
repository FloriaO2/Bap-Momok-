'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './tinder.module.css';
import { Suspense } from 'react';
import Image from "next/image";
import { ref, onValue, off } from 'firebase/database';
import { database } from '../../firebase';

const getEmojiForCandidate = (candidate: any): string => {
  if (candidate.type === 'custom') {
    return '🍽️';
  }

  const category = candidate.detail?.category || '';

  if (category.includes('피자') || category.includes('이탈리안')) return '🍕';
  if (category.includes('치킨')) return '🍗';
  if (category.includes('중국집') || category.includes('중식')) return '🥡';
  if (category.includes('일식') || category.includes('돈까스') || category.includes('초밥')) return '🍣';
  if (category.includes('한식')) return '🍚';
  if (category.includes('카페') || category.includes('디저트')) return '☕️';
  
  return '🍽️'; // 기본값
};

function TinderPageContent() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupData, setGroupData] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState<{ type: string, url: string, label: string } | null>(null);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuList, setMenuList] = useState<{name: string, image: string|null}[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string|null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('group_id');
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [touchStart, setTouchStart] = useState<{x: number, y: number, time: number} | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [showSwipeText, setShowSwipeText] = useState(false);
  const [cardPos, setCardPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [swipeText, setSwipeText] = useState<string | null>(null);
  const [cardGone, setCardGone] = useState(false);
  const [cardGoneDir, setCardGoneDir] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(0);
  const cardRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => { 
    setIsClient(true); 
    setWindowWidth(window.innerWidth);
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 그룹 데이터와 후보들 가져오기
  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId) return;
      
      try {
        const response = await fetch(`${BACKEND_URL}/groups/${groupId}`);
        const data = await response.json();
        setGroupData(data);
        
        // 후보들을 배열로 변환
        const candidatesArray = Object.entries(data.candidates || {}).map(([id, candidate]: [string, any]) => ({
          id,
          ...candidate
        }));
        setCandidates(candidatesArray);
      } catch (error) {
        console.error("그룹 데이터 가져오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroupData();
  }, [groupId]);

  // 투표 제출 (비동기 Fire-and-forget)
  const submitVote = (candidateId: string, vote: string) => {
    if (!groupId) return;
    
    const participantId = sessionStorage.getItem(`participant_id_${groupId}`);
    if (!participantId) {
      console.error('참가자 정보가 없습니다. 다시 참여해주세요.');
      return;
    }

    fetch(`${BACKEND_URL}/groups/${groupId}/votes/${participantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [candidateId]: vote })
    }).then(response => {
      if (!response.ok) {
        console.error('투표 제출에 실패했습니다.');
      } else {
        console.log(`[${participantId}]님이 [${candidateId}]에 [${vote}] 투표함`);
      }
    }).catch(error => {
      console.error('투표 제출 실패:', error);
    });
  };

  // 카드 스와이프 처리
  const onSwipe = (direction: string, candidateId: string) => {
    let vote = '';
    switch (direction) {
      case 'right':
        vote = 'good';
        break;
      case 'left':
        vote = 'bad';
        break;
      case 'up':
        vote = 'soso';
        break;
      case 'down':
        vote = 'never';
        break;
    }
    
    if (vote) {
      submitVote(candidateId, vote);
    }
    
    setCurrentCardIndex(prev => prev + 1);
  };

  // 카드가 슬라이드되고 있을 때 방향 표시 (실제 슬라이드 거리에 따라)
  const onSwipeRequirementFulfilled = (direction: string) => {
    console.log('Swipe requirement fulfilled:', direction);
    setSwipeDirection(direction);
    setShowSwipeText(true);
  };

  // 슬라이드가 취소되었을 때
  const onSwipeRequirementUnfulfilled = () => {
    console.log('Swipe requirement unfulfilled');
    setShowSwipeText(false);
    setSwipeDirection(null);
  };

  // 카드가 화면을 벗어났을 때
  const onCardLeftScreen = (candidateId: string) => {
    console.log(`${candidateId} 카드가 화면을 벗어났습니다.`);
  };

  // 카드 클릭 시 상세정보/메뉴 모달
  const handleCardClick = async (candidate: any) => {
    if (candidate.type === 'kakao' && candidate.detail?.kakao_id) {
      setModalInfo({
        type: 'kakao',
        url: `https://place.map.kakao.com/${candidate.detail.kakao_id}`,
        label: `카카오@https://place.map.kakao.com/${candidate.detail.kakao_id}`
      });
      setModalOpen(true);
    } else if (candidate.type === 'yogiyo' && candidate.detail?.yogiyo_id) {
      setMenuModalOpen(true);
      setMenuLoading(true);
      setMenuError(null);
      setMenuList([]);
      try {
        const res = await fetch(`${BACKEND_URL}/yogiyo-menu/${candidate.detail.yogiyo_id}`);
        if (!res.ok) throw new Error("메뉴 정보를 불러올 수 없습니다");
        const data = await res.json();
        setMenuList(data.menus || []);
      } catch (e: any) {
        setMenuError(e.message || "메뉴 정보를 불러올 수 없습니다");
      } finally {
        setMenuLoading(false);
      }
    } else if (candidate.type === 'custom' && candidate.detail?.URL) {
      setModalInfo({
        type: 'custom',
        url: candidate.detail.URL,
        label: `커스텀@${candidate.detail.URL}`
      });
      setModalOpen(true);
    } else {
      setModalInfo({
        type: 'etc',
        url: '',
        label: candidate.name
      });
      setModalOpen(true);
    }
  };

  // 모바일 tap/swipe 구분용 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setTouchStart({ x: t.clientX, y: t.clientY, time: Date.now() });
  };
  const handleTouchEnd = (e: React.TouchEvent, candidate: any) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = Math.abs(t.clientX - touchStart.x);
    const dy = Math.abs(t.clientY - touchStart.y);
    const dt = Date.now() - touchStart.time;
    
    // 카드가 중앙 기본 위치에 있을 때만 터치로 상세정보 표시
    if (Math.abs(cardPos.x) < 5 && Math.abs(cardPos.y) < 5) {
      // 10px 이하 이동, 300ms 이하면 tap으로 간주
      if (dx < 10 && dy < 10 && dt < 300) {
        handleCardClick(candidate);
      }
    }
    // 카드가 중앙에서 벗어나 있으면 드래그로 투표 (기존 로직 유지)
    
    setTouchStart(null);
  };

  // 카드 드래그 시작
  const handlePointerDown = (e: React.PointerEvent) => {
    if (cardGone) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - cardPos.x, y: e.clientY - cardPos.y });
  };
  // 카드 드래그 중
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStart || cardGone) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setCardPos({ x: newX, y: newY });
    // 화면 중앙 기준 사분면 판별 (데드존 포함)
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;
      const deadZoneRadius = Math.min(window.innerWidth * 0.3, window.innerHeight * 0.15); // 화면 크기에 비례한 데드존
      const distanceFromCenter = Math.sqrt(
        Math.pow(cardCenterX - centerX, 2) + Math.pow(cardCenterY - centerY, 2)
      );
      
      // 타원형 데드존 체크 (가로/세로 반지름이 다름)
      const deadZoneRadiusX = window.innerWidth * 0.15; // 가로 반지름
      const deadZoneRadiusY = window.innerHeight * 0.2; // 세로 반지름
      const normalizedDistance = Math.pow((cardCenterX - centerX) / deadZoneRadiusX, 2) + 
                                Math.pow((cardCenterY - centerY) / deadZoneRadiusY, 2);
      
      // 타원형 데드존 내부면 텍스트 숨김
      if (normalizedDistance <= 1) {
        setSwipeText(null);
        return;
      }
      
      // 데드존 외부에서만 사분면 판별
      if (Math.abs(cardCenterX - centerX) > Math.abs(cardCenterY - centerY)) {
        if (cardCenterX > centerX) setSwipeText('GOOD');
        else setSwipeText('BAD');
      } else {
        if (cardCenterY > centerY) setSwipeText('NEVER');
        else setSwipeText('SOSO');
      }
    }
  };
  // 카드 드래그 끝
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || cardGone) return;
    
    // 카드가 중앙 기본 위치에 있을 때만 클릭으로 간주
    if (dragStart && Math.abs(cardPos.x) < 5 && Math.abs(cardPos.y) < 5) {
      const dx = Math.abs(e.clientX - (dragStart.x + cardPos.x));
      const dy = Math.abs(e.clientY - (dragStart.y + cardPos.y));
      if (dx < 10 && dy < 10) {
        // 클릭으로 간주하여 상세정보 표시
        handleCardClick(currentCandidate);
        setIsDragging(false);
        setDragStart(null);
        setSwipeText(null);
        setCardPos({ x: 0, y: 0 });
        return;
      }
    }
    
    setIsDragging(false);
    if (!cardRef.current) {
      setSwipeText(null);
      setCardPos({ x: 0, y: 0 });
      return;
    }
    
    // 타원형 데드존 체크
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;
    const deadZoneRadiusX = window.innerWidth * 0.3; // 가로 반지름
    const deadZoneRadiusY = window.innerHeight * 0.15; // 세로 반지름
    const normalizedDistance = Math.pow((cardCenterX - centerX) / deadZoneRadiusX, 2) + 
                              Math.pow((cardCenterY - centerY) / deadZoneRadiusY, 2);
    
    // 타원형 데드존 안에 있으면 투표 없이 원위치로 복귀
    if (normalizedDistance <= 1) {
      setSwipeText(null);
      setCardPos({ x: 0, y: 0 });
      return;
    }
    
    // 데드존 밖에 있고 텍스트가 표시되어 있을 때만 투표 처리
    if (swipeText) {
      const threshold = 120; // px
      const dx = cardCenterX - centerX;
      const dy = cardCenterY - centerY;
      let direction: string | null = null;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > threshold) direction = 'right';
        else if (dx < -threshold) direction = 'left';
      } else {
        if (dy > threshold) direction = 'down';
        else if (dy < -threshold) direction = 'up';
      }
      
      if (direction) {
        // 투표 처리 & 카드 사라짐 애니메이션
        setCardGone(true);
        setCardGoneDir(direction);
        
        // 현재 표시된 텍스트를 투표 결과로 사용
        let voteResult = '';
        if (swipeText === 'GOOD') voteResult = 'good';
        else if (swipeText === 'BAD') voteResult = 'bad';
        else if (swipeText === 'SOSO') voteResult = 'soso';
        else if (swipeText === 'NEVER') voteResult = 'never';
        
        // 텍스트 숨김
        setSwipeText(null);
        
        // 카드가 완전히 사라진 후 다음 카드로
        setTimeout(() => {
          setCardGone(false);
          setCardGoneDir(null);
          setCardPos({ x: 0, y: 0 });
          setSwipeText(null);
          setCurrentCardIndex(prev => prev + 1);
          // 실제 투표 결과 제출
          if (voteResult) {
            submitVote(currentCandidate.id, voteResult);
          }
        }, 500);
      } else {
        // 임계값 미만이면 원위치 복귀
        setSwipeText(null);
        setCardPos({ x: 0, y: 0 });
      }
    } else {
      // 텍스트가 없으면 원위치 복귀
      setCardPos({ x: 0, y: 0 });
    }
  };

  const goToParticipate = () => {
    if (groupId) {
      router.push(`/participate/${groupId}`);
    }
  };

  // 3초 후 자동 이동 (모든 카드 스와이프 시)
  useEffect(() => {
    if (!loading && candidates.length === 0 && groupId) {
      // 후보가 하나도 없으면 바로 live-results로 이동
      router.push(`/live-results/${groupId}`);
      return;
    }
    if (!loading && currentCardIndex >= candidates.length && groupId) {
      const timeout = setTimeout(() => {
        router.push(`/live-results/${groupId}`);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [currentCardIndex, candidates.length, groupId, loading]);

  useEffect(() => {
    // 3초마다 투표 완료 여부 확인 후 true면 바로 live-results로 이동
    const participantId = groupId ? sessionStorage.getItem(`participant_id_${groupId}`) : null;
    if (groupId && participantId) {
      const interval = setInterval(() => {
        fetch(`${BACKEND_URL}/groups/${groupId}/participants/${participantId}/vote_complete`)
          .then(res => res.json())
          .then(data => {
            if (data.vote_complete) {
              router.push(`/live-results/${groupId}`);
            }
          })
          .catch(err => {
            console.error('vote_complete API 확인 실패:', err);
          });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [groupId]);

  // 후보 실시간 감지 (Firebase)
  useEffect(() => {
    if (!groupId) return;
    const candidatesRef = ref(database, `groups/${groupId}/candidates`);
    const candidatesCallback = (snapshot: any) => {
      const data = snapshot.val() || {};
      const candidatesArray = Object.entries(data).map(([id, candidate]: [string, any]) => ({
        id,
        ...candidate
      }));
      setCandidates(candidatesArray);
    };
    onValue(candidatesRef, candidatesCallback);
    return () => off(candidatesRef, "value", candidatesCallback);
  }, [groupId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.backgroundImage}>
          <div className={styles.overlay}>
            <div className={styles.completionContainer}>
              <h2 className={styles.completionTitle}>로딩 중...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 카드가 끝났을 때 또는 후보가 아예 없을 때
  if (candidates.length === 0) {
    // 후보가 없으면 아무 메시지도 띄우지 않고 바로 이동
    return null;
  }
  if (currentCardIndex >= candidates.length) {
    return (
      <div className={styles.container}>
        <div 
          className={styles.backgroundImage}
          style={{
            backgroundImage: 'url(/background_img.png)'
          }}
        >
          <div className={styles.overlay}>
            <div className={styles.completionContainer}>
              <h2 className={styles.completionTitle}>모든 후보를 투표했습니다!</h2>
              <p className={styles.completionText}>투표가 완료되었습니다.<br/>잠시후 결과 화면으로 이동합니다.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentCandidate = candidates[currentCardIndex];
  
  return (
    <div className={styles.container}>
      {/* 배경 이미지 */}
      <div 
        className={styles.backgroundImage}
        style={{
          backgroundImage: 'url(/background_img.png)',
          animation: 'backgroundMove 20s ease-in-out infinite'
        }}
      >
        {/* 오버레이 그라데이션 */}
        <div className={styles.overlay}>
          {/* 헤더 */}
          <div className={styles.cardHeader}>
            <div style={{ textAlign: 'center' }}>
              <h2 className={styles.cardTitle}>투표하기</h2>
              <span className={styles.progressText}>{currentCardIndex + 1} / {candidates.length}</span>
            </div>
          </div>
          
          {/* 카드 컨테이너 */}
          <div className={styles.cardContainer}>
            <div style={{width: 320, margin: '0 auto', position: 'relative'}}>
              {isClient && candidates.slice(currentCardIndex, currentCardIndex + 3).map((candidate, index) => {
                const isTopCard = index === 0;
                const cardIndex = currentCardIndex + index;
                
                return (
                  <div
                    key={candidate.id}
                    ref={isTopCard ? cardRef : null}
                    className={styles.card}
                    style={{
                      cursor: isTopCard ? (isDragging ? 'grabbing' : 'grab') : 'default',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: isTopCard 
                        ? (cardGone
                            ? cardGoneDir === 'right' ? 'translate(-50%, -50%) translateX(1200px)' :
                              cardGoneDir === 'left' ? 'translate(-50%, -50%) translateX(-1200px)' :
                              cardGoneDir === 'up' ? 'translate(-50%, -50%) translateY(-1200px)' :
                              cardGoneDir === 'down' ? 'translate(-50%, -50%) translateY(1200px)' :
                              `translate(-50%, -50%) translate(${cardPos.x}px, ${cardPos.y}px)`
                            : `translate(-50%, -50%) translate(${cardPos.x}px, ${cardPos.y}px)`)
                        : `translate(-50%, -50%) translateY(${index * 8}px) scale(${1 - index * 0.05})`,
                      opacity: isTopCard ? (cardGone ? 0 : 1) : 1,
                      transition: isTopCard ? (isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.5s') : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.5s',
                      userSelect: 'none',
                      touchAction: 'none',
                      zIndex: 100 - index,
                      pointerEvents: isTopCard ? 'auto' : 'none',
                    }}
                    onPointerDown={isTopCard ? handlePointerDown : undefined}
                    onPointerMove={isTopCard ? handlePointerMove : undefined}
                    onPointerUp={isTopCard ? handlePointerUp : undefined}
                    onPointerLeave={isTopCard ? handlePointerUp : undefined}
                    onTouchStart={isTopCard ? handleTouchStart : undefined}
                    onTouchEnd={isTopCard ? (e) => handleTouchEnd(e, candidate) : undefined}
                  >
                    {/* 슬라이드 방향 텍스트 오버레이 */}
                    {isTopCard && swipeText && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                          pointerEvents: 'none',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '48px',
                            fontWeight: 'bold',
                            color: swipeText === 'GOOD' ? '#4CAF50' : 
                                   swipeText === 'BAD' ? '#F44336' :
                                   swipeText === 'SOSO' ? '#FF9800' : '#9C27B0',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                            opacity: 0.9,
                          }}
                        >
                          {swipeText}
                        </div>
                      </div>
                    )}
                    
                    <div className={styles.cardEmoji}>
                      {getEmojiForCandidate(candidate)}
                    </div>
                    <div className={styles.cardName}>{candidate.name}</div>
                    <div className={styles.cardType}>
                      {candidate.type === 'kakao' ? '카카오맵' : 
                       candidate.type === 'yogiyo' ? '요기요' : '커스텀'}
                    </div>
                    {candidate.detail && (
                      <div className={styles.cardDetail}>
                        {candidate.type === 'kakao' && candidate.detail.addr && (
                          <div>📍 {candidate.detail.addr}</div>
                        )}
                        {candidate.type === 'yogiyo' && candidate.detail.delivery_time && (
                          <div>⏰ 배달시간: {candidate.detail.delivery_time}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* 방향 안내 */}
          <div className={styles.directionContainer}>
            <div className={styles.directionGrid}>
              {/* 상단 */}
              <div className={styles.directionItem} style={{ gridArea: 'top' }}>
                <div className={styles.directionText}>⬆️</div>
                <div className={styles.directionText}>쏘쏘</div>
              </div>
              
              {/* 중앙 */}
              <div className={styles.directionItem} style={{ gridArea: 'center' }}>
                <div className={styles.directionText}>⬅️ 싫어요&nbsp;&nbsp;&nbsp;&nbsp;좋아요 ➡️</div>
              </div>
              
              {/* 하단 */}
              <div className={styles.directionItem} style={{ gridArea: 'bottom' }}>
                <div className={styles.directionText}>안돼</div>
                <div className={styles.directionText}>⬇️</div>
              </div>
            </div>
          </div>
          
          {/* 안내 텍스트 */}
          <div className={styles.instructionContainer}>
            <p className={styles.instructionText}>
              {windowWidth <= 400
                ? <>카드를 드래그하여 투표하고,<br />클릭해서 상세정보를 확인하세요!</>
                : '카드를 드래그하여 투표하고, 클릭해서 상세정보를 확인하세요!'
              }
            </p>
          </div>

          {/* 결과 보기 버튼들 */}
          <div style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px',
            display: 'flex',
            gap: '10px'
          }}>
          </div>
        </div>
      </div>
      {/* 상세정보 모달 */}
      {modalOpen && modalInfo && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 12, width: "90vw", maxWidth: 600, height: "80vh", position: "relative", padding: 0, textAlign: 'center', overflow: 'hidden'
            }}
          >
            <button
              onClick={() => setModalOpen(false)}
              style={{
                position: "absolute", top: 10, right: 10, background: "none", border: "none", fontSize: 24, cursor: "pointer", zIndex: 2
              }}
            >✕</button>
            {modalInfo.type === 'kakao' ? (
              <iframe
                src={modalInfo.url}
                style={{ width: "100%", height: "100%", border: "none", borderRadius: 12 }}
                title="카카오 플레이스"
              />
            ) : modalInfo.type === 'yogiyo' ? (
              <>
                <div style={{fontWeight:'bold', marginBottom:8}}>요기요</div>
                <a href={modalInfo.url} target="_blank" rel="noopener noreferrer" style={{color:'#994d52', wordBreak:'break-all'}}>{modalInfo.label}</a>
              </>
            ) : modalInfo.type === 'custom' ? (
              <>
                <div style={{fontWeight:'bold', marginBottom:8}}>커스텀 링크</div>
                <a href={modalInfo.url} target="_blank" rel="noopener noreferrer" style={{color:'#994d52', wordBreak:'break-all'}}>{modalInfo.label}</a>
              </>
            ) : (
              <div>{modalInfo.label}</div>
            )}
          </div>
        </div>
      )}
      {/* 요기요 메뉴 모달 */}
      {menuModalOpen && (
        <div
          onClick={() => setMenuModalOpen(false)}
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 12, width: "90vw", maxWidth: 500, maxHeight: '80vh', overflowY: 'auto', position: "relative", padding: 24, textAlign: 'center'
            }}
          >
            <button
              onClick={() => setMenuModalOpen(false)}
              style={{
                position: "absolute", top: 10, right: 10, background: "none", border: "none", fontSize: 24, cursor: "pointer", color: '#222'
              }}
            >✕</button>
            <h3 style={{fontWeight:'bold', marginBottom:16, fontSize:20, color:'#222'}}>메뉴</h3>
            {menuLoading ? (
              <div style={{color:'#999', padding:40}}>메뉴 불러오는 중...</div>
            ) : menuError ? (
              <div style={{color:'#e57373', padding:40}}>{menuError}</div>
            ) : menuList.length === 0 ? (
              <div style={{color:'#999', padding:40}}>메뉴가 없습니다</div>
            ) : (
              <div style={{display:'flex', flexWrap:'wrap', gap:20, justifyContent:'center'}}>
                {menuList.map((menu, idx) => (
                  <div key={menu.name + '-' + idx} style={{width:120, textAlign:'center'}}>
                    {menu.image ? (
                      <img src={menu.image} alt={menu.name} style={{width:100, height:80, objectFit:'cover', borderRadius:8, marginBottom:8}} />
                    ) : (
                      <div style={{width:100, height:80, background:'#eee', borderRadius:8, marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#aaa', fontSize:13}}>
                        이미지 없음
                      </div>
                    )}
                    <div style={{fontSize:14, color:'#222', fontWeight:500}}>{menu.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TinderPage() {
  return (
    <Suspense fallback={<div>로딩중...</div>}>
      <TinderPageContent />
    </Suspense>
  );
} 