import { useState, useEffect } from "react";
import { useCategory } from "../../contexts/CategoryContext";
import { useSchedule } from "../../contexts/ScheduleContext";
import { auth } from "../../firebase";
import ModalPortal from "../../components/ModalPortal";
import "../../assets/scss/section/AddDailyItem.scss";

/** 반복값 매핑: 프론트 ↔ 백엔드 */
const mapRepeatToServer = (r) => {
  if (r === "매일") return "daily";
  if (r === "매주") return "weekly";
  if (r === "매달") return "monthly";
  return "none";
};
const mapRepeatFromServer = (r) => {
  if (r === "daily") return "매일";
  if (r === "weekly") return "매주";
  if (r === "monthly") return "매달";
  return "한번";
};

/** YYYY-MM-DD */
const toDateKey = (v) => {
  if (typeof v === "string") return v.slice(0, 10);
  const d = new Date(v);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

function AddDailyItem({ date, category, closePopup, editItem = null }) {
  const { categories } = useCategory();
  const { addTodo, updateTodo, deleteTodo } = useSchedule();

  const categoryInfo = categories?.find((c) => c.name === category);
  const isEditMode = !!editItem;

  const [title, setTitle] = useState("");
  const [repeat, setRepeat] = useState("한번");
  const [isPublic, setIsPublic] = useState(true);   // ✅ 기본 공개
  const [memo, setMemo] = useState("");
  const [startDate, setStartDate] = useState(date);
  const [endDate, setEndDate] = useState(date);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // UI용: 비공개 스위치 상태
  const isPrivate = !isPublic;

  useEffect(() => {
    if (isEditMode) {
      setTitle(editItem.title || "");
      setRepeat(mapRepeatFromServer(editItem.repeat) || "한번");
      setIsPublic(
        typeof editItem.isPublic === "boolean" ? editItem.isPublic : !!editItem.public
      );
      setMemo(editItem.memo || "");
      setStartDate(editItem.startDate || date);
      setEndDate(editItem.endDate || editItem.startDate || date);
    } else {
      // 신규 추가(+): 기본 공개 → 스위치 OFF(비공개 꺼짐)
      setTitle("");
      setRepeat("한번");
      setIsPublic(true); // ✅ 여기 유지
      setMemo("");
      setStartDate(date);
      setEndDate(date);
    }
  }, [editItem, date, isEditMode]);

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("로그인 정보가 없습니다.");

      const payload = {
        title: title.trim(),
        categoryId: categoryInfo?.id ?? null,
        categoryName: categoryInfo?.name ?? null,
        startDate: toDateKey(startDate),
        endDate: toDateKey(endDate || startDate),
        repeat: mapRepeatToServer(repeat),
        isPublic, // 서버에는 공개 여부 그대로 전송
        memo: memo.trim(),
      };

      if (isEditMode && editItem?.id) await updateTodo(editItem.id, payload);
      else await addTodo(payload);

      closePopup();
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || submitting) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      if (!editItem?.id) throw new Error("삭제할 항목의 id가 없습니다.");
      await deleteTodo(editItem.id);
      closePopup();
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "삭제 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="popup-layer" onClick={closePopup}>
        <div className="popup-card" onClick={(e) => e.stopPropagation()}>
          <div className="A-popup">
            <div className="popup-header">
              <h2>{isEditMode ? "일정 수정" : `${date}`}</h2>
              <button className="close-btn" onClick={closePopup} disabled={submitting}>✕</button>
            </div>

            <div className="popup-body">
              {errorMsg && <div className="error-msg">{errorMsg}</div>}

              <div className="form-group">
                <label>반복</label>
                <select
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value)}
                  disabled={submitting}
                >
                  <option value="한번">한번</option>
                  <option value="매일">매일</option>
                  <option value="매주">매주</option>
                  <option value="매달">매달</option>
                </select>
              </div>

              {repeat === "한번" ? (
                <div className="form-group">
                  <label>일자</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>기간</label>
                  <div className="range-inputs">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={submitting}
                    />
                    <span>~</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}

              {/* 비공개 스위치: 같은 라인에서 우측 끝 정렬 + ON일 때만 lock */}
              <div className={`form-group public-row ${submitting ? "disabled" : ""}`}>
                <span className="field-title">비공개</span>

                <div className="public-controls">
                  <input
                    id="private"
                    type="checkbox"
                    className="sr-only switch-input"
                    role="switch"
                    aria-checked={isPrivate}
                    checked={isPrivate}                     // UI는 비공개 상태에 바인딩
                    onChange={() => setIsPublic((p) => !p)} // 토글 시 공개값 반전
                    disabled={submitting}
                  />
                  <label
                    htmlFor="private"
                    className={`switch-track ${isPrivate ? "on" : "off"}`} // on = 비공개
                    aria-hidden="true"
                  >
                    <span className="switch-knob" />
                  </label>

                  {isPrivate && (
                    <img src="/img/lock.svg" alt="" aria-hidden="true" className="lock-inline" />
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>할 일 추가</label>
                <input
                  type="text"
                  placeholder="할 일을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>메모</label>
                <textarea
                  placeholder="메모를 입력하세요"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="button-row">
                <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "처리 중…" : isEditMode ? "수정하기" : "등록하기"}
                </button>
                {isEditMode && (
                  <button className="delete-btn" onClick={handleDelete} disabled={submitting}>
                    {submitting ? "처리 중…" : "삭제하기"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export default AddDailyItem;
