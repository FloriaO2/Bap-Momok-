'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function HomePage() {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const router = useRouter();

  // 방 참여 함수
  const joinRoom = (inputRoomId: string) => {
    console.log('joinRoom 함수 호출됨, inputRoomId:', inputRoomId);
    
    if (inputRoomId && inputRoomId.trim()) {
      console.log('방 ID가 유효함, 카카오지도 화면으로 이동');
      // URL 파라미터로 방 ID 전달
      router.push(`/map?roomId=${encodeURIComponent(inputRoomId.trim())}`);
      setShowJoinModal(false);
      setJoinRoomInput('');
    } else {
      console.log('방 ID가 유효하지 않음');
      alert('방 ID를 입력해주세요.');
    }
  };

  // 방 참여 모달 열기
  const openJoinModal = () => {
    console.log('방 참여 모달 열기');
    setShowJoinModal(true);
  };

  // 방 참여 모달 닫기
  const closeJoinModal = () => {
    setShowJoinModal(false);
    setJoinRoomInput('');
  };

  // Create Room 버튼 클릭 (현재는 비활성화)
  const createRoom = () => {
    alert('Create Room 기능은 현재 개발 중입니다. 나중에 틴더 기능과 함께 추가될 예정입니다!');
  };

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
          {/* 메인 콘텐츠 */}
          <div className={styles.content}>
            {/* 타이틀 */}
            <h1 className={styles.title}>Bap! Momok?</h1>
            
            {/* 버튼 컨테이너 */}
            <div className={styles.buttonContainer}>
              {/* Create Room 버튼 */}
              <button 
                className={styles.createButton}
                onClick={createRoom}
              >
                Create Room
              </button>
              
              {/* Join Room 버튼 */}
              <button 
                className={styles.joinButton}
                onClick={openJoinModal}
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Join Room 모달 */}
      {showJoinModal && (
        <div className={styles.modalOverlay} onClick={closeJoinModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>방 참여</h2>
            <input
              className={styles.modalInput}
              type="text"
              placeholder="방 ID를 입력하세요"
              value={joinRoomInput}
              onChange={(e) => setJoinRoomInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  joinRoom(joinRoomInput);
                }
              }}
            />
            <button
              className={styles.modalButton}
              onClick={() => joinRoom(joinRoomInput)}
            >
              참여
            </button>
            <button
              className={styles.modalButton}
              onClick={closeJoinModal}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
