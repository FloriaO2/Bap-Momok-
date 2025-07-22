'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TinderCard from 'react-tinder-card';
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
  useEffect(() => { setIsClient(true); }, []);

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
    // 20px 이하 이동, 500ms 이하면 tap으로 간주
    if (dx < 20 && dy < 20 && dt < 500) {
      handleCardClick(candidate);
    }
    setTouchStart(null);
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80)'
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
          backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80)'
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
            <div style={{width: 320, margin: '0 auto'}}>
              <div style={{display:'flex', justifyContent:'center', marginBottom: 12}}>
                <button
                  onClick={() => handleCardClick(currentCandidate)}
                  style={{
                    background: '#fff', color: '#994d52', border: '1px solid #994d52', borderRadius: 8,
                    fontWeight: 600, fontSize: 14, padding: '6px 14px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                >
                  상세정보
                </button>
              </div>
              {isClient && (
                <TinderCard
                  key={currentCandidate.id}
                  onSwipe={(dir) => onSwipe(dir, currentCandidate.id)}
                  onCardLeftScreen={() => onCardLeftScreen(currentCandidate.id)}
                  preventSwipe={[]}
                  swipeThreshold={20}
                  swipeRequirementType="position"
                >
                  <div
                    className={styles.card}
                    style={{cursor:'pointer', position:'relative', margin: '0 auto'}}
                  >
                    <div className={styles.cardEmoji}>
                      {getEmojiForCandidate(currentCandidate)}
                    </div>
                    <div className={styles.cardName}>{currentCandidate.name}</div>
                    <div className={styles.cardType}>
                      {currentCandidate.type === 'kakao' ? '카카오맵' : 
                       currentCandidate.type === 'yogiyo' ? '요기요' : '커스텀'}
                    </div>
                    {currentCandidate.detail && (
                      <div className={styles.cardDetail}>
                        {currentCandidate.type === 'kakao' && currentCandidate.detail.addr && (
                          <div>📍 {currentCandidate.detail.addr}</div>
                        )}
                        {currentCandidate.type === 'yogiyo' && currentCandidate.detail.delivery_time && (
                          <div>⏰ 배달시간: {currentCandidate.detail.delivery_time}</div>
                        )}
                      </div>
                    )}
                  </div>
                </TinderCard>
              )}
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
              카드를 원하는 방향으로 스와이프하여 투표하세요!
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