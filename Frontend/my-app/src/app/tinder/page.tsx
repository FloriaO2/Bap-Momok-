'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TinderCard from 'react-tinder-card';
import styles from './tinder.module.css';
import { Suspense } from 'react';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('group_id');
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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

  const goToParticipate = () => {
    if (groupId) {
      router.push(`/participate/${groupId}`);
    }
  };

  // 3초 후 자동 이동 (모든 카드 스와이프 시)
  useEffect(() => {
    if (!loading && candidates.length === 0 && groupId) {
      // 후보가 하나도 없으면 바로 live-results로 이동
      window.location.href = `/live-results/${groupId}`;
      return;
    }
    if (!loading && currentCardIndex >= candidates.length && groupId) {
      const timeout = setTimeout(() => {
        window.location.href = `/live-results/${groupId}`;
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [currentCardIndex, candidates.length, groupId, loading]);

  useEffect(() => {
    // 투표 완료 여부 확인 후 true면 바로 live-results로 이동
    const participantId = groupId ? sessionStorage.getItem(`participant_id_${groupId}`) : null;
    const checkVoteComplete = () => {
      if (groupId && participantId) {
        fetch(`${BACKEND_URL}/groups/${groupId}/participants/${participantId}/vote_complete`)
          .then(res => res.json())
          .then(data => {
            if (data.vote_complete) {
              window.location.href = `/live-results/${groupId}`;
            }
          })
          .catch(err => {
            console.error('vote_complete API 확인 실패:', err);
          });
      }
    };
    checkVoteComplete(); // 렌더링 직후 1회
    const timeout = setTimeout(checkVoteComplete, 3000); // 3초 후 1회 더
    return () => clearTimeout(timeout);
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
              <p className={styles.completionText}>투표가 완료되었습니다.<br/>잠시후 실시간 결과 화면으로 이동합니다.</p>
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
            <button 
              className={styles.backButton}
              onClick={goToParticipate}
            >
              ← 뒤로가기
            </button>
            <h2 className={styles.cardTitle}>투표하기</h2>
            <span className={styles.progressText}>{currentCardIndex + 1} / {candidates.length}</span>
          </div>
          
          {/* 카드 컨테이너 */}
          <div className={styles.cardContainer}>
            <TinderCard
              key={currentCandidate.id}
              onSwipe={(dir) => onSwipe(dir, currentCandidate.id)}
              onCardLeftScreen={() => onCardLeftScreen(currentCandidate.id)}
              preventSwipe={[]}
              swipeThreshold={20}
              swipeRequirementType="position"
            >
              <div className={styles.card}>
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
                      <div>⏰ 배달시간: {currentCandidate.detail.delivery_time}분</div>
                    )}
                  </div>
                )}
              </div>
            </TinderCard>
          </div>
          
          {/* 방향 안내 */}
          <div className={styles.directionContainer}>
            <div className={styles.directionRow}>
              <div className={styles.directionItem}>
                <span className={styles.directionText}>⬆️ 쏘쏘</span>
              </div>
            </div>
            <div className={styles.directionRow}>
              <div className={styles.directionItem}>
                <span className={styles.directionText}>⬅️ 싫어요</span>
              </div>
              <div className={styles.directionItem}>
                <span className={styles.directionText}>좋아요 ➡️</span>
              </div>
            </div>
            <div className={styles.directionRow}>
              <div className={styles.directionItem}>
                <span className={styles.directionText}>절대 안돼 ⬇️</span>
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