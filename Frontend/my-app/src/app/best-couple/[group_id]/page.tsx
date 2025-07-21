"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface BestCoupleResponse {
  best_couple: string[];
  best_couple_ids: string[];
  max_inner_product: number | null;
}

interface GroupData {
  candidates: Record<string, { name: string }>;
  votes: Record<string, Record<string, string>>;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function BestCouplePage() {
  const params = useParams();
  const groupId = params.group_id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bestCouple, setBestCouple] = useState<BestCoupleResponse | null>(null);
  const [groupData, setGroupData] = useState<GroupData | null>(null);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    fetch(`${BACKEND_URL}/groups/${groupId}/best_couple`)
      .then(res => {
        if (!res.ok) throw new Error("best_couple API 호출 실패");
        return res.json();
      })
      .then(data => setBestCouple(data))
      .catch(e => setError(e.message));
    fetch(`${BACKEND_URL}/groups/${groupId}`)
      .then(res => {
        if (!res.ok) throw new Error("그룹 데이터 조회 실패");
        return res.json();
      })
      .then(data => setGroupData(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [groupId]);

  if (loading) return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fbeaec 0%, #f3e9e7 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{background: "#fff", borderRadius: 20, padding: 40, textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", color:'#222'}}>
        로딩 중...
      </div>
    </div>
  );
  if (error) return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fbeaec 0%, #f3e9e7 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{background: "#fff", borderRadius: 20, padding: 40, textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", color:'#994d52'}}>
        {error}
      </div>
    </div>
  );
  if (!bestCouple || !groupData) return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fbeaec 0%, #f3e9e7 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{background: "#fff", borderRadius: 20, padding: 40, textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", color:'#222'}}>
        데이터가 없습니다.
      </div>
    </div>
  );
  if (!bestCouple.best_couple || bestCouple.best_couple.length < 2) return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fbeaec 0%, #f3e9e7 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{background: "#fff", borderRadius: 20, padding: 40, textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", color:'#222'}}>
        비교할 참가자가 충분하지 않습니다.
      </div>
    </div>
  );

  const [name1, name2] = bestCouple.best_couple;
  const [id1, id2] = bestCouple.best_couple_ids;
  const candidates = groupData.candidates || {};
  const votes = groupData.votes || {};
  const vote1 = votes[id1] || {};
  const vote2 = votes[id2] || {};
  const voteLabel = { good: "좋아요", soso: "쏘쏘", bad: "싫어요", never: "절대안돼" };
  const voteColor = { good: "#994d52", soso: "#bdb76b", bad: "#e57373", never: "#616161" };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fbeaec 0%, #f3e9e7 100%)",
      padding: "20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        maxWidth: 600,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 20,
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        padding: 40,
        border: "none"
      }}>
        <h2 style={{textAlign:'center', marginBottom:24, color:'#222', fontWeight:700, fontSize:28, letterSpacing:-1}}>Best Couple</h2>
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', marginBottom:24}}>
          <div style={{fontWeight:'bold', fontSize:20, color:'#222'}}>{name1}</div>
          <div style={{fontSize:28, color:'#994d52', margin:'0 8px'}} aria-label="하트" title="하트">❤️</div>
          <div style={{fontWeight:'bold', fontSize:20, color:'#222'}}>{name2}</div>
        </div>
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', marginBottom:24}}>
          <div style={{fontSize:16, color:'#222', background:'#fbeaec', borderRadius:8, padding:'6px 18px', fontWeight:600}}>
            유사도 점수: <span style={{color:'#994d52'}}>{bestCouple.max_inner_product}</span>
          </div>
        </div>
        <table style={{width:'100%', borderCollapse:'collapse', background:'#faf9f6', borderRadius:12, overflow:'hidden', color:'#222'}}>
          <thead>
            <tr style={{background:'#f3e9e7', color:'#222'}}>
              <th style={{padding:10, borderBottom:'1px solid #eee', fontWeight:700}}>후보</th>
              <th style={{padding:10, borderBottom:'1px solid #eee', fontWeight:700}}>{name1}의 선택</th>
              <th style={{padding:10, borderBottom:'1px solid #eee', fontWeight:700}}>{name2}의 선택</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(candidates).map(([cid, c]) => {
              const v1 = vote1[cid];
              const v2 = vote2[cid];
              let highlight = undefined;
              if (v1 && v1 === v2) {
                if (v1 === "good") highlight = { background: "#ffe4ec" };
                else if (v1 === "bad") highlight = { background: "#f3e9e7" };
                else if (v1 === "soso") highlight = { background: "#fff9e3" };
                else if (v1 === "never") highlight = { background: "#e0e0e0" };
              }
              return (
                <tr key={cid} style={{color:'#222', ...highlight}}>
                  <td style={{padding:10, borderBottom:'1px solid #eee'}}>{c.name}</td>
                  <td style={{padding:10, borderBottom:'1px solid #eee', color:voteColor[v1 as keyof typeof voteColor] || '#222', fontWeight:500}}>
                    {voteLabel[v1 as keyof typeof voteLabel] || '-'}
                  </td>
                  <td style={{padding:10, borderBottom:'1px solid #eee', color:voteColor[v2 as keyof typeof voteColor] || '#222', fontWeight:500}}>
                    {voteLabel[v2 as keyof typeof voteLabel] || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{marginTop:32, textAlign:'center', color:'#333', fontSize:15}}>
          두 참가자가 각 후보에 대해 얼마나 비슷한 선택을 했는지 내적 점수로 보여줍니다.<br/>
          점수가 높을수록 취향이 비슷합니다.
        </div>
      </div>
    </div>
  );
} 