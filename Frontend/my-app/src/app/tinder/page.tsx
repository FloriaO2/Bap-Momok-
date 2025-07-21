'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TinderCard from 'react-tinder-card';
import styles from './tinder.module.css';
import { Suspense } from 'react';

function TinderPageContent() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupData, setGroupData] = useState<any>(null);
  const [userVotes, setUserVotes] = useState<{[key: string]: string}>({});
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
  }, [groupId, router]);

  // 투표 제출
  const submitVote = async (candidateId: string, vote: string) => {
    if (!groupId) return;
    
    const participantId = sessionStorage.getItem(`participant_id_${groupId}`);
    if (!participantId) {
      alert('참가자 정보가 없습니다. 다시 참여해주세요.');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/groups/${groupId}/votes/${participantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [candidateId]: vote })
      });
      
      if (response.ok) {
        setUserVotes(prev => ({ ...prev, [candidateId]: vote }));
      } else {
        alert('투표 제출에 실패했습니다.');
      }
    } catch (error) {
      console.error('투표 제출 실패:', error);
      alert('투표 제출에 실패했습니다.');
    }
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

  // 홈으로 돌아가기
  const goHome = () => {
    router.push('/');
  };

  // 결과 보기
  const viewResults = () => {
    if (groupId) {
      router.push(`/results/${groupId}`);
    }
  };

  // 참여 화면으로 돌아가기
  const goToParticipate = () => {
    if (groupId) {
      router.push(`/participate/${groupId}`);
    }
  };

  // 모든 후보 투표 완료 시 vote_complete true로 업데이트
  React.useEffect(() => {
    if (currentCardIndex >= candidates.length) {
      if (!groupId) return;
      const participantId = sessionStorage.getItem(`participant_id_${groupId}`);
      if (!participantId) return;
      const updateVoteComplete = async () => {
        try {
          await fetch(`${BACKEND_URL}/groups/${groupId}/participants/${participantId}/vote-complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vote_complete: true })
          });
        } catch (e) {
          // TODO: 토스트로 안내 (alert 대체)
          alert('투표 완료 상태 업데이트에 실패했습니다.');
        }
      };
      updateVoteComplete();
    }
  }, [groupId, currentCardIndex, candidates.length]);

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
              <p className={styles.completionText}>투표가 완료되었습니다.</p>
              <div className={styles.completionButtons}>
                <button 
                  className={styles.completionButton}
                  onClick={() => { 
                    if (groupId) {
                      window.location.href = `/live-results/${groupId}`;
                    } else {
                      alert('groupId가 없습니다!');
                    }
                  }}
                  style={{ background: '#28a745' }}
                >
                  실시간 결과
                </button>
                <button 
                  className={styles.completionButton}
                  onClick={viewResults}
                  style={{ background: '#dc3545' }}
                >
                  최종 결과
                </button>
                {/* 참여 화면으로 버튼 제거 */}
                <button 
                  className={styles.completionButton}
                  onClick={goHome}
                >
                  홈으로
                </button>
              </div>
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
                  {currentCandidate.type === 'kakao' ? '🏪' : 
                   currentCandidate.type === 'yogiyo' ? '🍕' : '🍽️'}
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
            <button 
              onClick={() => { 
                if (groupId) {
                  window.location.href = `/live-results/${groupId}`;
                } else {
                  alert('groupId가 없습니다!');
                }
              }}
              style={{
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)'
              }}
            >
              실시간 결과
            </button>
            <button 
              onClick={viewResults}
              style={{
                background: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(220, 53, 69, 0.3)'
              }}
            >
              최종 결과
            </button>
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