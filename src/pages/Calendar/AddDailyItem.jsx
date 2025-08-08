import { useState, useEffect } from "react";
import { useCategory } from "../../contexts/CategoryContext";
import { useSchedule } from "../../contexts/ScheduleContext";
import "../../assets/scss/section/AddDailyItem.scss";

function AddDailyItem({ date, category, closePopup, editItem = null }) {
    const { categories } = useCategory();
    const { addSchedule, updateSchedule, deleteSchedule, moveSchedule } = useSchedule();

    const categoryInfo = categories?.find(c => c.name === category);

    const isEditMode = !!editItem;

    const [title, setTitle] = useState("");
    const [repeat, setRepeat] = useState("한번");
    const [isPublic, setIsPublic] = useState(false);
    const [memo, setMemo] = useState("");
    const [startDate, setStartDate] = useState(date);
    const [endDate, setEndDate] = useState(date);

    useEffect(() => {
        if (isEditMode) {
            setTitle(editItem.title || "");
            setRepeat(editItem.repeat || "한번");
            setIsPublic(editItem.public || false);
            setMemo(editItem.memo || "");
            setStartDate(editItem.startDate || date);
            setEndDate(editItem.endDate || date);
        } else {
            setTitle("");
            setRepeat("한번");
            setIsPublic(false);
            setMemo("");
            setStartDate(date);
            setEndDate(date);
        }
    }, [editItem, date, isEditMode]);

    const getRepeatDates = () => {
        const dates = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const current = new Date(start);

        while (current <= end) {
            dates.push(current.toISOString().slice(0, 10));

            switch (repeat) {
                case "매일":
                    current.setDate(current.getDate() + 1);
                    break;
                case "매주":
                    current.setDate(current.getDate() + 7);
                    break;
                case "매달":
                    current.setMonth(current.getMonth() + 1);
                    break;
                default:
                    return [date];
            }
        }
        return dates;
    };

    const handleSubmit = () => {
        if (!title.trim()) return;

        const newItem = {
            id: editItem?.id || Date.now(),
            title,
            memo,
            repeat,
            public: isPublic,
            startDate,
            endDate,
            category,
            color: categoryInfo?.color || "#a2d2ff",
            date: (typeof startDate === "string" ? startDate : new Date(startDate).toISOString().slice(0, 10))
        };

        if (isEditMode) {
            const originalDate = typeof editItem?.date === "string" ? editItem.date : new Date(editItem.date).toISOString().slice(0, 10);
            const targetDate = typeof startDate === "string" ? startDate : new Date(startDate).toISOString().slice(0, 10);

            if (originalDate === targetDate) {
                updateSchedule(originalDate, editItem.id, {
                    ...newItem,
                    date: targetDate,
                });
            } else {
                moveSchedule(originalDate, targetDate, editItem.id, {
                    ...newItem,
                    date: targetDate,
                });
            }
        } else {
            // 신규 추가 로직
            const dates = repeat === "한번" ? [newItem.date] : getRepeatDates();
            dates.forEach((d, i) => {
                addSchedule(d, { ...newItem, id: Date.now() + i, date: d });
            });
        }

        closePopup();
    };
    ;

    const handleDelete = () => {
        if (isEditMode) {
            const originalDate = new Date(editItem.date).toISOString().slice(0, 10);
            deleteSchedule(originalDate, editItem.id);
            closePopup();
        }
    };

    return (
        <div className="A-popup">
            <div className="popup-header">
                <h2>{isEditMode ? "일정 수정" : `${date} 일정 추가`}</h2>
                <button className="close-btn" onClick={closePopup}>✕</button>
            </div>

            <div className="popup-body">
                <div className="form-group">
                    <label>🔁 반복</label>
                    <select value={repeat} onChange={(e) => setRepeat(e.target.value)}>
                        <option value="한번">한번</option>
                        <option value="매일">매일</option>
                        <option value="매주">매주</option>
                        <option value="매달">매달</option>
                    </select>
                </div>

                {repeat !== "한번" && (
                    <div className="form-group">
                        <label>📅 기간</label>
                        <div className="range-inputs">
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            <span>~</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>
                )}

                <div className="form-group toggle-row">
                    <label>공개</label>
                    <input type="checkbox" checked={isPublic} onChange={() => setIsPublic(!isPublic)} />
                </div>

                <div className="form-group">
                    <label>할 일 추가</label>
                    <input
                        type="text"
                        placeholder="할 일을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>메모</label>
                    <textarea
                        placeholder="메모를 입력하세요"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                    />
                </div>

                <div className="button-row">
                    <button className="submit-btn" onClick={handleSubmit}>
                        {isEditMode ? "수정하기" : "등록하기"}
                    </button>
                    {isEditMode && (
                        <button className="delete-btn" onClick={handleDelete}>
                            삭제하기
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AddDailyItem;
