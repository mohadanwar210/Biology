import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  getQuestionsForTopic,
  questions,
  topics,
  type Question,
  type QuestionType,
  type Topic,
} from "./data/questions";

type Mode = "study" | "quiz";
type QuizStage = "setup" | "active" | "results";
type StudyFilter = "all" | QuestionType;

const STUDY_PAGE_SIZE = 4;
const ALL_TOPICS_ID = "all";
const ARABIC_LETTERS = ["أ", "ب", "ج", "د"];

function toArabicDigits(value: number | string) {
  return String(value).replace(/[0-9]/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
}

function loadStudiedIds(): string[] {
  try {
    const value = window.localStorage.getItem("biology-studied-v1");
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function loadBestScore() {
  try {
    const score = Number(window.localStorage.getItem("biology-best-score-v1"));
    return Number.isFinite(score) ? score : 0;
  } catch {
    return 0;
  }
}

function shuffled<T,>(values: T[]) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[otherIndex]] = [result[otherIndex], result[index]];
  }
  return result;
}

function ArrowIcon({ left = false }: { left?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={left ? "arrow-icon arrow-icon-left" : "arrow-icon"}>
      <path d="M3.5 10h12M10 4.5 15.5 10 10 15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BrandMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" className="brand-mark">
      <rect x="1" y="1" width="46" height="46" rx="16" fill="#D7E4C1" />
      <path d="M13 29.7c7.4.3 14.8-5.6 19.8-16.1 2.8 12.3-2.3 22.1-10.4 23.2-5 .7-8.7-2.2-9.4-7.1Z" fill="#244A3C" />
      <path d="M15 34c3.1-5 7.6-9.2 14.6-13.4" stroke="#D7E4C1" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="33.5" cy="14.5" r="2" fill="#E88E62" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="check-icon">
      <path d="m4.5 10.2 3.4 3.4 7.7-7.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BiologyIllustration() {
  return (
    <svg className="biology-illustration" viewBox="0 0 580 390" fill="none" role="img" aria-label="رسم توضيحي لنجم بحر وأسماك ونباتات بحرية">
      <defs>
        <radialGradient id="star-core" cx="0" cy="0" r="1" gradientTransform="matrix(128 85 -85 128 273 182)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#809A70" />
          <stop offset="1" stopColor="#476B56" />
        </radialGradient>
        <linearGradient id="fish-line" x1="362" x2="512" y1="248" y2="248" gradientUnits="userSpaceOnUse">
          <stop stopColor="#DFB274" />
          <stop offset="1" stopColor="#8CB096" />
        </linearGradient>
        <pattern id="art-grid" width="34" height="34" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#B8CBAF" fillOpacity=".2" />
        </pattern>
      </defs>

      <circle cx="292" cy="195" r="171" stroke="#C3D1B8" strokeOpacity=".12" />
      <circle cx="292" cy="195" r="135" stroke="#C3D1B8" strokeOpacity=".1" strokeDasharray="2 9" />
      <circle cx="292" cy="195" r="200" fill="url(#art-grid)" opacity=".45" />

      <g className="orbit-mark">
        <circle cx="455" cy="89" r="5" fill="#E88E62" />
        <circle cx="455" cy="89" r="13" stroke="#E88E62" strokeOpacity=".4" />
      </g>

      <g className="hero-starfish">
        <path
          d="M283.4 75c13.1-1.8 19 39.7 27.8 67.9 23.1-18.4 54.7-47 65.3-37.3 10.4 9.4-18.7 39-37.7 62.1 28.1 8.9 69.1 15.1 67.4 28.2-1.7 13.2-43.4 12.1-72.9 13.1 14.6 25.6 39.3 59.9 28.3 69.1-10.8 8.9-40.1-20.7-62.2-41.1-10.4 27.4-20.1 68.1-33.1 65.3-13-2.8-8.3-44.3-6.5-73.7-24.3 16.7-56.7 43.6-66.4 33.3-9.6-10.4 22-38.5 44-60.1-27.9-10.1-68.6-18-65.8-31 2.7-13 44.1-10.1 73.5-7.9-16.1-24.7-42.3-56-32.4-66.3 10-10.1 39.3 19.4 61.1 40.7 9.8-27.6 18.4-68.5 31.6-68.3Z"
          fill="url(#star-core)"
          stroke="#C8D7B7"
          strokeWidth="1.6"
        />
        <path d="M284 155c-8 20-12 45-11 68m8-52c-19-9-39-16-58-18m67 21c15-17 29-30 43-40m-36 56c23 1 45 5 64 12m-70 0c-8 23-13 46-15 66m8-56c-20 11-37 24-53 39" stroke="#D1DFC2" strokeOpacity=".63" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="280" cy="194" r="17" fill="#D4DFBF" fillOpacity=".18" stroke="#D4DFBF" strokeOpacity=".65" />
        <circle cx="280" cy="194" r="4" fill="#E88E62" />
        <circle cx="279" cy="160" r="2" fill="#E3C288" />
        <circle cx="311" cy="185" r="2" fill="#E3C288" />
        <circle cx="260" cy="217" r="2" fill="#E3C288" />
        <circle cx="292" cy="221" r="2" fill="#E3C288" />
      </g>

      <g className="illustration-fish" stroke="url(#fish-line)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        <path d="M372 276c24-26 61-38 100-22 12 5 24 12 34 22-11 11-22 18-35 23-38 14-75 2-99-23Z" />
        <path d="M505 276c17-15 30-22 45-24-7 12-7 36 0 49-15-3-28-10-45-25Z" />
        <path d="M418 254c8-14 19-22 32-25-2 13-1 23 2 34m-32 34c8 12 19 19 32 21-2-12-1-21 2-31" />
        <path d="M389 276h101m-57-18c10 6 14 12 17 18m-17 18c10-6 14-12 17-18" strokeOpacity=".55" />
        <circle cx="392" cy="270" r="2.3" fill="#DFB274" stroke="none" />
      </g>

      <g className="seaweed" stroke="#8BA689" strokeWidth="1.7" strokeLinecap="round">
        <path d="M89 329c13-31 13-59 2-86m1 56c-15-4-26-15-30-29m31 10c13-8 21-20 22-35m-26 62c-13-2-21-9-27-19" />
        <path d="M111 330c8-22 8-41 1-60m1 39c12-4 20-12 23-23m-24 5c-10-6-16-14-18-25" stroke="#789779" />
        <path d="M83 330h53" strokeOpacity=".55" />
      </g>

      <g className="floating-bubbles" fill="#D3DFBF">
        <circle cx="151" cy="97" r="3" fillOpacity=".55" />
        <circle cx="175" cy="73" r="2" fillOpacity=".8" />
        <circle cx="387" cy="113" r="2.7" fillOpacity=".6" />
        <circle cx="432" cy="152" r="2" fillOpacity=".8" />
        <circle cx="336" cy="337" r="2.2" fillOpacity=".65" />
      </g>
      <path d="M152 337h349" stroke="#D0DCC4" strokeOpacity=".17" />
    </svg>
  );
}

function StudyQuestionRow({
  question,
  number,
  isStudied,
  onMark,
}: {
  question: Question;
  number: number;
  isStudied: boolean;
  onMark: () => void;
}) {
  return (
    <article className="study-question-row">
      <span className="question-index">{toArabicDigits(String(number).padStart(2, "0"))}</span>
      <div className="study-question-body">
        <div className="question-kind">{question.type === "tf" ? "صح أم خطأ" : "اختر الإجابة الصحيحة"}</div>
        <h3>{question.prompt}</h3>
        {question.type === "mc" && question.options && (
          <div className="study-options" aria-label="الاختيارات">
            {question.options.map((option, index) => (
              <span className={option === question.answer ? "study-option is-correct" : "study-option"} key={option}>
                <span className="option-letter">{ARABIC_LETTERS[index]}</span>
                {option}
              </span>
            ))}
          </div>
        )}
        <div className="learning-answer">
          <span className="answer-label">الإجابة</span>
          <strong>{question.answer}</strong>
          <span className="answer-explanation">{question.explanation}</span>
        </div>
      </div>
      <button
        type="button"
        className={isStudied ? "review-button is-reviewed" : "review-button"}
        onClick={onMark}
        aria-pressed={isStudied}
        aria-label={isStudied ? "إلغاء إتمام مراجعة السؤال" : "تحديد السؤال كمكتمل المراجعة"}
      >
        <span className="review-check"><CheckIcon /></span>
        <span>{isStudied ? "تمت المراجعة" : "فهمت الإجابة"}</span>
      </button>
    </article>
  );
}

function TopicRail({
  selectedTopicId,
  studiedIds,
  onSelect,
}: {
  selectedTopicId: string;
  studiedIds: string[];
  onSelect: (topic: Topic) => void;
}) {
  const totalReviewed = studiedIds.length;
  const completion = Math.round((totalReviewed / questions.length) * 100);

  return (
    <aside className="topic-rail" aria-label="وحدات المذاكرة">
      <div className="rail-heading">
        <span className="rail-eyebrow">فهرس المراجعة</span>
        <h2>الوحدات</h2>
      </div>
      <nav className="topic-navigation">
        {topics.map((topic, index) => {
          const topicQuestions = getQuestionsForTopic(topic.id);
          const reviewed = topicQuestions.filter((question) => studiedIds.includes(question.id)).length;
          const isSelected = topic.id === selectedTopicId;

          return (
            <button
              className={isSelected ? "topic-nav-item is-selected" : "topic-nav-item"}
              type="button"
              key={topic.id}
              onClick={() => onSelect(topic)}
              aria-current={isSelected ? "page" : undefined}
            >
              <span className="topic-number">{toArabicDigits(String(index + 1).padStart(2, "0"))}</span>
              <span className="topic-nav-copy">
                <strong>{topic.shortTitle}</strong>
                <span>{toArabicDigits(reviewed)} من {toArabicDigits(topicQuestions.length)} سؤالا</span>
              </span>
              <span className="topic-nav-arrow" aria-hidden="true">↙</span>
            </button>
          );
        })}
      </nav>

      <div className="overall-study-progress">
        <div className="overall-progress-top">
          <span>تقدم المراجعة</span>
          <strong>{toArabicDigits(completion)}٪</strong>
        </div>
        <div className="thin-progress-track" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100} aria-label={`تمت مراجعة ${completion} بالمئة من الأسئلة`}>
          <span style={{ width: `${completion}%` }} />
        </div>
        <p>راجعت {toArabicDigits(totalReviewed)} من أصل {toArabicDigits(questions.length)} سؤالا</p>
      </div>
    </aside>
  );
}

function App() {
  const [mode, setMode] = useState<Mode>("study");
  const [activeTopicId, setActiveTopicId] = useState(topics[0].id);
  const [studyFilter, setStudyFilter] = useState<StudyFilter>("all");
  const [studyPage, setStudyPage] = useState(0);
  const [studiedIds, setStudiedIds] = useState<string[]>(loadStudiedIds);
  const [quizTopicId, setQuizTopicId] = useState(topics[0].id);
  const [quizLength, setQuizLength] = useState(8);
  const [quizStage, setQuizStage] = useState<QuizStage>("setup");
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [bestScore, setBestScore] = useState(loadBestScore);

  const activeTopic = topics.find((topic) => topic.id === activeTopicId) ?? topics[0];
  const currentQuizQuestion = quizQuestions[quizIndex];

  useEffect(() => {
    try {
      window.localStorage.setItem("biology-studied-v1", JSON.stringify(studiedIds));
    } catch {
      // Progress remains available for the current session if storage is disabled.
    }
  }, [studiedIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem("biology-best-score-v1", String(bestScore));
    } catch {
      // Best score is a convenience and is not required to use the quiz.
    }
  }, [bestScore]);

  const topicQuestions = useMemo(() => getQuestionsForTopic(activeTopicId), [activeTopicId]);
  const filteredStudyQuestions = useMemo(
    () => topicQuestions.filter((question) => studyFilter === "all" || question.type === studyFilter),
    [studyFilter, topicQuestions],
  );
  const pageCount = Math.max(1, Math.ceil(filteredStudyQuestions.length / STUDY_PAGE_SIZE));
  const visibleStudyQuestions = filteredStudyQuestions.slice(
    studyPage * STUDY_PAGE_SIZE,
    (studyPage + 1) * STUDY_PAGE_SIZE,
  );
  const quizCandidateCount = quizTopicId === ALL_TOPICS_ID
    ? questions.length
    : getQuestionsForTopic(quizTopicId).length;
  const quizCorrectCount = quizQuestions.filter((question) => selectedAnswers[question.id] === question.answer).length;
  const quizScore = quizQuestions.length ? Math.round((quizCorrectCount / quizQuestions.length) * 100) : 0;
  const missedQuestions = quizQuestions.filter((question) => selectedAnswers[question.id] !== question.answer);
  const quizTopic = topics.find((topic) => topic.id === quizTopicId);

  function scrollToWorkspace() {
    window.setTimeout(() => {
      document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  }

  function openStudy() {
    setMode("study");
    scrollToWorkspace();
  }

  function openQuiz() {
    setMode("quiz");
    setQuizStage("setup");
    setQuizTopicId(activeTopicId);
    scrollToWorkspace();
  }

  function selectTopic(topic: Topic) {
    setActiveTopicId(topic.id);
    setStudyPage(0);
    setStudyFilter("all");
  }

  function toggleStudied(questionId: string) {
    setStudiedIds((current) => current.includes(questionId)
      ? current.filter((id) => id !== questionId)
      : [...current, questionId]);
  }

  function startQuiz() {
    const sourceQuestions = quizTopicId === ALL_TOPICS_ID
      ? questions
      : getQuestionsForTopic(quizTopicId);
    const nextQuestions = shuffled(sourceQuestions).slice(0, Math.min(quizLength, sourceQuestions.length));
    setQuizQuestions(nextQuestions);
    setQuizIndex(0);
    setSelectedAnswers({});
    setQuizStage("active");
  }

  function chooseAnswer(answer: string) {
    if (!currentQuizQuestion || selectedAnswers[currentQuizQuestion.id] !== undefined) return;
    setSelectedAnswers((current) => ({ ...current, [currentQuizQuestion.id]: answer }));
  }

  function nextQuizQuestion() {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((current) => current + 1);
      return;
    }

    const correct = quizQuestions.filter((question) => selectedAnswers[question.id] === question.answer).length;
    const score = quizQuestions.length ? Math.round((correct / quizQuestions.length) * 100) : 0;
    setBestScore((current) => Math.max(current, score));
    setQuizStage("results");
  }

  function tryAgain() {
    setQuizStage("setup");
    setSelectedAnswers({});
  }

  function reviewQuizErrors() {
    if (missedQuestions.length) {
      const firstTopic = topics.find((topic) => topic.id === missedQuestions[0].topicId);
      if (firstTopic) setActiveTopicId(firstTopic.id);
    } else if (quizTopic) {
      setActiveTopicId(quizTopic.id);
    }
    setStudyPage(0);
    setStudyFilter("all");
    setMode("study");
    scrollToWorkspace();
  }

  function selectStudyFilter(nextFilter: StudyFilter) {
    setStudyFilter(nextFilter);
    setStudyPage(0);
  }

  return (
    <div className="app-shell" id="top" dir="rtl">
      <header className="hero-section">
        <div className="hero-inner">
          <div className="topbar">
            <a className="brand-lockup" href="#top" aria-label="مِجهر الأحياء، الصفحة الرئيسية">
              <BrandMark />
              <span className="brand-wordmark">مِجهر<span>الأحياء</span></span>
            </a>
            <nav className="top-navigation" aria-label="القائمة الرئيسية">
              <button type="button" onClick={openStudy}>المذاكرة</button>
              <button type="button" onClick={openQuiz}>الاختبار</button>
              <a href="#about">عن المراجعة</a>
            </nav>
          </div>

          <div className="hero-grid">
            <div className="hero-copy">
              <p className="hero-eyebrow"><span className="eyebrow-dot" /> مراجعة تفاعلية لأسئلة الأحياء</p>
              <h1>مِجهر الأحياء</h1>
              <p className="hero-description">ذاكر الإجابات بتركيز، ثم اختبر فهمك بأسئلة من نفس المنهج. خطوة خطوة، من المراجعة إلى الإتقان.</p>
              <div className="hero-actions">
                <button className="button button-primary" type="button" onClick={openStudy}>
                  ابدأ المذاكرة <ArrowIcon />
                </button>
                <button className="button button-quiet" type="button" onClick={openQuiz}>
                  اذهب للاختبار <ArrowIcon />
                </button>
              </div>
            </div>
            <div className="hero-art-wrap">
              <BiologyIllustration />
            </div>
          </div>
          <div className="hero-bottom-rule" aria-hidden="true"><span>01</span><i /></div>
        </div>
      </header>

      <main id="workspace" className="workspace">
        <div className="workspace-inner">
          <div className="workspace-heading">
            <div className="workspace-title-block">
              <span className="section-eyebrow">مسار المراجعة</span>
              <h2>من الإجابة إلى الإتقان</h2>
            </div>
            <div className="mode-switch" role="tablist" aria-label="اختر مرحلة المراجعة">
              <button
                type="button"
                className={mode === "study" ? "mode-step is-active" : "mode-step"}
                onClick={openStudy}
                role="tab"
                aria-selected={mode === "study"}
              >
                <span className="mode-step-number">٠١</span>
                <span>ذاكر الإجابات</span>
              </button>
              <span className={mode === "quiz" ? "mode-connector is-active" : "mode-connector"} />
              <button
                type="button"
                className={mode === "quiz" ? "mode-step is-active" : "mode-step"}
                onClick={openQuiz}
                role="tab"
                aria-selected={mode === "quiz"}
              >
                <span className="mode-step-number">٠٢</span>
                <span>حل الاختبار</span>
              </button>
            </div>
          </div>

          {mode === "study" ? (
            <div className="content-layout study-layout" role="tabpanel">
              <TopicRail
                selectedTopicId={activeTopicId}
                studiedIds={studiedIds}
                onSelect={selectTopic}
              />
              <section className="study-panel" aria-labelledby="study-title">
                <div className="study-section-heading">
                  <div>
                    <span className="section-eyebrow">الوحدة {toArabicDigits(String(topics.findIndex((topic) => topic.id === activeTopicId) + 1).padStart(2, "0"))} / ٠٤</span>
                    <h2 id="study-title">{activeTopic.title}</h2>
                    <p>{activeTopic.description}</p>
                  </div>
                  <div className="topic-review-count">
                    <span>{toArabicDigits(topicQuestions.filter((question) => studiedIds.includes(question.id)).length)}</span>
                    <i>/</i>
                    <span>{toArabicDigits(topicQuestions.length)}</span>
                    <small>تمت مراجعتها</small>
                  </div>
                </div>

                <div className="study-toolbar">
                  <div className="study-filters" role="group" aria-label="تصفية الأسئلة">
                    <button type="button" className={studyFilter === "all" ? "filter-tab is-active" : "filter-tab"} onClick={() => selectStudyFilter("all")}>كل الأسئلة</button>
                    <button type="button" className={studyFilter === "tf" ? "filter-tab is-active" : "filter-tab"} onClick={() => selectStudyFilter("tf")}>صح أو خطأ</button>
                    <button type="button" className={studyFilter === "mc" ? "filter-tab is-active" : "filter-tab"} onClick={() => selectStudyFilter("mc")}>اختيار من متعدد</button>
                  </div>
                  <span className="question-total">{toArabicDigits(filteredStudyQuestions.length)} سؤالا</span>
                </div>

                {visibleStudyQuestions.length ? (
                  <div className="study-question-list">
                    {visibleStudyQuestions.map((question) => {
                      const originalIndex = topicQuestions.findIndex((item) => item.id === question.id) + 1;
                      return (
                        <StudyQuestionRow
                          key={question.id}
                          question={question}
                          number={originalIndex}
                          isStudied={studiedIds.includes(question.id)}
                          onMark={() => toggleStudied(question.id)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="empty-state">لا توجد أسئلة في هذا التصنيف حاليا.</p>
                )}

                <div className="study-pagination">
                  <button type="button" onClick={() => setStudyPage((page) => Math.max(0, page - 1))} disabled={studyPage === 0}>
                    <ArrowIcon left /> السابق
                  </button>
                  <span>صفحة {toArabicDigits(studyPage + 1)} من {toArabicDigits(pageCount)}</span>
                  <button type="button" onClick={() => setStudyPage((page) => Math.min(pageCount - 1, page + 1))} disabled={studyPage >= pageCount - 1}>
                    التالي <ArrowIcon />
                  </button>
                </div>

                <div className="next-step-callout">
                  <div>
                    <span className="next-step-kicker">بعد مراجعة هذه الوحدة</span>
                    <strong>تأكد من فهمك باختبار قصير</strong>
                  </div>
                  <button type="button" className="text-link-button" onClick={openQuiz}>
                    اختبر نفسك <ArrowIcon />
                  </button>
                </div>
              </section>
            </div>
          ) : quizStage === "setup" ? (
            <div className="content-layout quiz-setup-layout" role="tabpanel">
              <aside className="topic-rail quiz-rail" aria-label="اختيار موضوع الاختبار">
                <div className="rail-heading">
                  <span className="rail-eyebrow">اختر نطاقك</span>
                  <h2>موضوع الاختبار</h2>
                </div>
                <nav className="topic-navigation">
                  <button
                    className={quizTopicId === ALL_TOPICS_ID ? "topic-nav-item is-selected" : "topic-nav-item"}
                    type="button"
                    onClick={() => setQuizTopicId(ALL_TOPICS_ID)}
                    aria-current={quizTopicId === ALL_TOPICS_ID ? "page" : undefined}
                  >
                    <span className="topic-number">٠٠</span>
                    <span className="topic-nav-copy"><strong>كل الوحدات</strong><span>{toArabicDigits(questions.length)} سؤالا متاحا</span></span>
                    <span className="topic-nav-arrow" aria-hidden="true">↙</span>
                  </button>
                  {topics.map((topic, index) => {
                    const isSelected = quizTopicId === topic.id;
                    const count = getQuestionsForTopic(topic.id).length;
                    return (
                      <button
                        className={isSelected ? "topic-nav-item is-selected" : "topic-nav-item"}
                        type="button"
                        key={topic.id}
                        onClick={() => setQuizTopicId(topic.id)}
                        aria-current={isSelected ? "page" : undefined}
                      >
                        <span className="topic-number">{toArabicDigits(String(index + 1).padStart(2, "0"))}</span>
                        <span className="topic-nav-copy"><strong>{topic.shortTitle}</strong><span>{toArabicDigits(count)} سؤالا متاحا</span></span>
                        <span className="topic-nav-arrow" aria-hidden="true">↙</span>
                      </button>
                    );
                  })}
                </nav>
              </aside>

              <section className="quiz-setup-panel" aria-labelledby="quiz-setup-title">
                <div className="quiz-setup-heading">
                  <span className="section-eyebrow">خطوتك الثانية</span>
                  <h2 id="quiz-setup-title">اختبر ما تعلمته</h2>
                  <p>{quizTopic ? `أسئلة متنوعة من وحدة ${quizTopic.title}.` : "أسئلة متنوعة من جميع وحدات الأحياء التي راجعتها."} يظهر لك التصحيح بعد كل إجابة.</p>
                </div>

                <div className="quiz-length-picker">
                  <div>
                    <strong>كم سؤالا تريد؟</strong>
                    <span>بنك هذا النطاق يحتوي على {toArabicDigits(quizCandidateCount)} سؤالا.</span>
                  </div>
                  <div className="length-options" role="group" aria-label="عدد أسئلة الاختبار">
                    {[6, 8, 12].map((length) => (
                      <button
                        type="button"
                        className={quizLength === length ? "length-option is-selected" : "length-option"}
                        key={length}
                        onClick={() => setQuizLength(length)}
                        aria-pressed={quizLength === length}
                      >
                        {toArabicDigits(length)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="quiz-guidance">
                  <span className="guidance-mark" aria-hidden="true">i</span>
                  <p>اختر إجابة واحدة لكل سؤال. خذ وقتك؛ لا يوجد مؤقت، ويمكنك رؤية التفسير مباشرة بعد الإجابة.</p>
                </div>

                <div className="quiz-setup-actions">
                  <button className="button button-primary dark-button" type="button" onClick={startQuiz}>
                    ابدأ الاختبار <ArrowIcon />
                  </button>
                  <span>يمكنك إعادة الاختبار متى شئت</span>
                </div>
              </section>
            </div>
          ) : quizStage === "active" && currentQuizQuestion ? (
            <section className="quiz-flow" aria-labelledby="current-question-title" role="tabpanel">
              <div className="quiz-flow-topline">
                <div>
                  <span className="section-eyebrow">{quizTopic ? quizTopic.title : "اختبار شامل"}</span>
                  <p>السؤال {toArabicDigits(quizIndex + 1)} <span>/</span> {toArabicDigits(quizQuestions.length)}</p>
                </div>
                <button className="leave-quiz-button" type="button" onClick={tryAgain}>إنهاء الاختبار</button>
              </div>
              <div className="quiz-progress-track" role="progressbar" aria-valuenow={quizIndex + (selectedAnswers[currentQuizQuestion.id] ? 1 : 0)} aria-valuemin={0} aria-valuemax={quizQuestions.length} aria-label={`السؤال ${quizIndex + 1} من ${quizQuestions.length}`}>
                <span style={{ width: `${((quizIndex + (selectedAnswers[currentQuizQuestion.id] ? 1 : 0)) / quizQuestions.length) * 100}%` }} />
              </div>

              <div className="quiz-question-area">
                <span className="quiz-question-kind">{currentQuizQuestion.type === "tf" ? "صح أم خطأ" : "اختر الإجابة الصحيحة"}</span>
                <h2 id="current-question-title">{currentQuizQuestion.prompt}</h2>
                <div className="quiz-choice-list">
                  {(currentQuizQuestion.type === "tf" ? ["صح", "خطأ"] : currentQuizQuestion.options ?? []).map((option, index) => {
                    const chosen = selectedAnswers[currentQuizQuestion.id] === option;
                    const isCorrect = currentQuizQuestion.answer === option;
                    const answered = selectedAnswers[currentQuizQuestion.id] !== undefined;
                    let className = "quiz-choice";
                    if (answered && isCorrect) className += " is-answer-correct";
                    else if (answered && chosen) className += " is-answer-wrong";

                    return (
                      <button
                        type="button"
                        className={className}
                        key={option}
                        onClick={() => chooseAnswer(option)}
                        disabled={answered}
                        aria-pressed={chosen}
                      >
                        <span className="choice-letter">{currentQuizQuestion.type === "tf" ? toArabicDigits(index + 1) : ARABIC_LETTERS[index]}</span>
                        <span>{option}</span>
                        {answered && isCorrect && <span className="choice-correct-mark"><CheckIcon /></span>}
                      </button>
                    );
                  })}
                </div>

                {selectedAnswers[currentQuizQuestion.id] !== undefined && (
                  <div className={selectedAnswers[currentQuizQuestion.id] === currentQuizQuestion.answer ? "answer-feedback is-correct" : "answer-feedback is-incorrect"} role="status">
                    <strong>{selectedAnswers[currentQuizQuestion.id] === currentQuizQuestion.answer ? "إجابة صحيحة" : "راجع هذه الفكرة"}</strong>
                    <p><span>الإجابة الصحيحة:</span> {currentQuizQuestion.answer}</p>
                    <p>{currentQuizQuestion.explanation}</p>
                  </div>
                )}

                <div className="quiz-navigation-row">
                  <span className="question-type-note">{currentQuizQuestion.type === "tf" ? "عبارة علمية" : "سؤال اختيار من متعدد"}</span>
                  <button
                    type="button"
                    className="button button-primary dark-button"
                    onClick={nextQuizQuestion}
                    disabled={selectedAnswers[currentQuizQuestion.id] === undefined}
                  >
                    {quizIndex === quizQuestions.length - 1 ? "عرض النتيجة" : "السؤال التالي"}
                    <ArrowIcon />
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="quiz-results" aria-labelledby="quiz-results-title" role="tabpanel">
              <div className="result-summary">
                <div className="result-score-mark" style={{ "--score": `${quizScore * 3.6}deg` } as CSSProperties} aria-hidden="true">
                  <span>{toArabicDigits(quizScore)}</span><small>٪</small>
                </div>
                <div className="result-copy">
                  <span className="section-eyebrow">اكتمل الاختبار</span>
                  <h2 id="quiz-results-title">{quizScore >= 80 ? "أحسنت، فهمك واضح" : quizScore >= 50 ? "تقدم جيد، واصل المراجعة" : "كل محاولة تقربك من الإتقان"}</h2>
                  <p>أجبت إجابة صحيحة عن {toArabicDigits(quizCorrectCount)} من {toArabicDigits(quizQuestions.length)} أسئلة.</p>
                  {bestScore > 0 && <span className="best-score-note">أفضل نتيجة لك: {toArabicDigits(bestScore)}٪</span>}
                </div>
              </div>

              {missedQuestions.length ? (
                <div className="mistake-review">
                  <div className="mistake-heading">
                    <h3>نقاط تستحق مراجعة إضافية</h3>
                    <span>{toArabicDigits(missedQuestions.length)} أسئلة</span>
                  </div>
                  {missedQuestions.map((question) => (
                    <article className="mistake-row" key={question.id}>
                      <span className="mistake-mark">!</span>
                      <div>
                        <h4>{question.prompt}</h4>
                        <p><strong>الصحيح: {question.answer}</strong><span>{question.explanation}</span></p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="perfect-score-note">أجبت عن كل الأسئلة بشكل صحيح. أحسنت!</p>
              )}

              <div className="result-actions">
                <button className="button button-primary dark-button" type="button" onClick={tryAgain}>اختبار جديد <ArrowIcon /></button>
                <button className="result-text-button" type="button" onClick={reviewQuizErrors}>ارجع إلى المذاكرة</button>
              </div>
            </section>
          )}
        </div>
      </main>

      <footer id="about" className="site-footer">
        <a className="footer-brand" href="#top"><BrandMark /><span>مِجهر الأحياء</span></a>
        <p>مراجعة هادئة، فهم أعمق، واستعداد أفضل للاختبار.</p>
        <span className="footer-credit">عمل الطالب محمد انور البقشي</span>
      </footer>
    </div>
  );
}

export default App;