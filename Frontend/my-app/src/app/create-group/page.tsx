"use client";
import { useRouter } from "next/navigation";

export default function CreateGroupPage() {
  const router = useRouter();

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <button onClick={() => router.back()} style={{ fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
        ←
      </button>
      <h2 style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 32 }}>Create a group</h2>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 32, marginRight: 12 }}>📍</span>
          <input
            placeholder="현재 위치"
            disabled
            style={{ flex: 1, padding: 16, borderRadius: 12, background: '#f3f4f6', border: 'none', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 32, marginRight: 12 }}>🕒</span>
          <input
            placeholder="회의 시작 시간"
            disabled
            style={{ flex: 1, padding: 16, borderRadius: 12, background: '#f3f4f6', border: 'none', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <input type="checkbox" id="delivery" style={{ marginRight: 8 }} />
          <label htmlFor="delivery" style={{ marginRight: 8 }}>Delivery</label>
          <input
            placeholder="최대 배달 시간"
            disabled
            style={{ flex: 1, padding: 8, borderRadius: 8, background: '#f3f4f6', border: 'none', width: '60%' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input type="checkbox" id="visit" style={{ marginRight: 8 }} />
          <label htmlFor="visit" style={{ marginRight: 8 }}>Visit</label>
          <input
            placeholder="최대 도보 시간"
            disabled
            style={{ flex: 1, padding: 8, borderRadius: 8, background: '#f3f4f6', border: 'none', width: '60%' }}
          />
        </div>
      </div>
    </div>
  );
} 