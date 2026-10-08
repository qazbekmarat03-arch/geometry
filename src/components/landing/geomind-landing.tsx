"use client";

import Image from "next/image";
import { BrandMark } from "@/components/layout/brand-mark";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Box,
  Check,
  Circle,
  FileText,
  Globe2,
  GraduationCap,
  Layers3,
  MessageCircle,
  Menu,
  Moon,
  Pause,
  Play,
  Plus,
  Rotate3D,
  Sparkles,
  Sun,
  Triangle,
  X,
} from "lucide-react";
import type { Solid } from "./geometry-scene";
import { LandingMotion } from "./landing-motion";
import { courseProgram } from "./course-program";

const WHATSAPP_URL = "https://wa.me/77755851203";

const GeometryScene = dynamic(() => import("./geometry-scene"), {
  ssr: false,
  loading: () => (
    <div className="gm-loading-shape" aria-hidden="true">
      <Box />
    </div>
  ),
});
type Language = "kk" | "ru" | "en";
const copy = (language: Language) => (kk: string, ru: string, en: string) =>
  ({ kk, ru, en })[language];

function Brand() {
  return (
    <a href="#top" className="gm-brand" aria-label="DURYSTAP">
      <span className="gm-brand-mark">
        <BrandMark />
      </span>
      <span className="gm-brand-durys">DURYS</span>
      <span className="gm-brand-tap">TAP</span>
    </a>
  );
}

function Lab({ language, paused }: { language: Language; paused: boolean }) {
  const t = copy(language);
  const [solid, setSolid] = useState<Solid>("cube");
  const [size, setSize] = useState(2);
  const [challenge, setChallenge] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const challenges = [
    {
      question: t(
        "Кубтың қырын 2 есе ұзартсақ, көлемі неше есе өседі?",
        "Во сколько раз вырастет объём куба, если удвоить ребро?",
        "Double a cube’s edge. How much does its volume grow?",
      ),
      choices: [2, 4, 8],
      correct: 8,
      size: 4,
      explanation: "2³ = 8 → 4³ = 64. 64 ÷ 8 = 8",
      unit: t("есе", "раз", "times"),
    },
    {
      question: t(
        "Ал сол кубтың бетінің ауданы неше есе өседі?",
        "А во сколько раз вырастет площадь поверхности?",
        "How much does its surface area grow?",
      ),
      choices: [2, 4, 8],
      correct: 4,
      size: 4,
      explanation: "6 × 2² = 24 → 6 × 4² = 96. 96 ÷ 24 = 4",
      unit: t("есе", "раз", "times"),
    },
    {
      question: t(
        "Көлемі 27 см³ кубтың қырын тап.",
        "Найди ребро куба объёмом 27 см³.",
        "Find the edge of a cube with volume 27 cm³.",
      ),
      choices: [3, 6, 9],
      correct: 3,
      size: 3,
      explanation: "V = a³ → a = ∛27 = 3 см",
      unit: t("см", "см", "cm"),
    },
  ];
  const task = challenges[challenge];
  const [visible, setVisible] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    if (panel.current) observer.observe(panel.current);
    return () => observer.disconnect();
  }, []);
  const area =
    solid === "cube"
      ? 6 * size ** 2
      : solid === "sphere"
        ? 4 * Math.PI * size ** 2
        : Math.sqrt(3) * size ** 2;
  const volume =
    solid === "cube"
      ? size ** 3
      : solid === "sphere"
        ? (4 / 3) * Math.PI * size ** 3
        : size ** 3 / (6 * Math.sqrt(2));
  const label =
    solid === "sphere"
      ? t("Радиус", "Радиус", "Radius")
      : t("Қыр ұзындығы", "Длина ребра", "Edge length");
  const format = (value: number) =>
    new Intl.NumberFormat(language === "kk" ? "kk-KZ" : language, {
      maximumFractionDigits: 2,
    }).format(value);
  return (
    <div className="gm-lab-panel" ref={panel}>
      <div className="gm-lab-canvas">
        <div className="gm-canvas-tag">
          <span className="gm-live-dot" />
          {t(
            "ИНТЕРАКТИВТІ КЕҢІСТІК",
            "ИНТЕРАКТИВНОЕ ПРОСТРАНСТВО",
            "INTERACTIVE SPACE",
          )}
        </div>
        {visible && (
          <GeometryScene
            variant="lab"
            solid={solid}
            size={size}
            paused={paused}
          />
        )}
        <div className="gm-axis" aria-hidden="true">
          <span>Y</span>
          <i />
          <b>X</b>
          <em>Z</em>
        </div>
        <div className="gm-canvas-note">
          <Rotate3D size={14} />
          {t(
            "Өлшемін өзгерт. Байланысты байқа.",
            "Меняй размер. Замечай связи.",
            "Change the size. See the connection.",
          )}
        </div>
      </div>
      <div className="gm-lab-controls">
        <div className="gm-challenge">
          <span className="gm-eyebrow">
            {t("3 ҚАДАМДЫ ЧЕЛЛЕНДЖ", "ЧЕЛЛЕНДЖ В 3 ШАГА", "3-STEP CHALLENGE")} ·{" "}
            {challenge + 1}/3
          </span>
          <h3>{task.question}</h3>
          <p>
            {t(
              "Алдымен болжам жаса. Сосын 3D фигурамен тексер.",
              "Сначала предположи. Потом проверь на 3D-фигуре.",
              "Make a prediction. Then check it in 3D.",
            )}
          </p>
          <div
            className="gm-challenge-answers"
            role="group"
            aria-label={t("Жауабың", "Твой ответ", "Your answer")}
          >
            {task.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                aria-pressed={answer === choice}
                onClick={() => {
                  setAnswer(choice);
                  setSolid("cube");
                  setSize(task.size);
                }}
              >
                {choice} {task.unit}
              </button>
            ))}
          </div>
          {answer !== null && (
            <div className="gm-challenge-feedback" role="status">
              <strong>
                {answer === task.correct
                  ? t("Дұрыс!", "Верно!", "Correct!")
                  : t(
                      "Бірге тексерейік.",
                      "Давай проверим.",
                      "Let’s check together.",
                    )}
              </strong>
              <p>{task.explanation}</p>
              <button
                type="button"
                className="gm-text-link"
                onClick={() => {
                  setChallenge((challenge + 1) % 3);
                  setAnswer(null);
                  setSolid("cube");
                  setSize(2);
                }}
              >
                {challenge === 2
                  ? t("Қайта байқап көр", "Попробовать снова", "Try again")
                  : t(
                      "Келесі тапсырма",
                      "Следующее задание",
                      "Next challenge",
                    )}{" "}
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
        <span className="gm-eyebrow">
          {t("ӨЗІҢ ЗЕРТТЕ", "ИССЛЕДУЙ", "EXPLORE IT")}
        </span>
        <h3>
          {t(
            "Енді өзің тәжірибе жаса.",
            "Оживи формулу.",
            "Bring formulas to life.",
          )}
        </h3>
        <div
          className="gm-solid-tabs"
          role="group"
          aria-label={t(
            "Фигураны таңдаңыз",
            "Выберите фигуру",
            "Choose a shape",
          )}
        >
          {(
            [
              ["cube", Box, t("Куб", "Куб", "Cube")],
              ["sphere", Circle, t("Шар", "Шар", "Sphere")],
              [
                "tetrahedron",
                Triangle,
                t("Тетраэдр", "Тетраэдр", "Tetrahedron"),
              ],
            ] as const
          ).map(([value, Icon, name]) => (
            <button
              key={value}
              type="button"
              aria-pressed={solid === value}
              onClick={() => setSolid(value)}
            >
              <Icon size={17} />
              {name}
            </button>
          ))}
        </div>
        <div className="gm-range-label">
          <label htmlFor="edge-size">{label}</label>
          <output htmlFor="edge-size">
            {format(size)} {t("см", "см", "cm")}
          </output>
        </div>
        <input
          id="edge-size"
          type="range"
          min="1"
          max="5"
          step=".1"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
        />
        <div className="gm-range-limits">
          <span>1 {t("см", "см", "cm")}</span>
          <span>5 {t("см", "см", "cm")}</span>
        </div>
        <div
          className="gm-formula-results"
          aria-live="polite"
          aria-atomic="true"
        >
          <div>
            <span>
              {t("Бетінің ауданы", "Площадь поверхности", "Surface area")}
            </span>
            <strong>
              {format(area)}
              <small> {t("см²", "см²", "cm²")}</small>
            </strong>
            <code>
              {solid === "cube"
                ? "S = 6a²"
                : solid === "sphere"
                  ? "S = 4πr²"
                  : "S = √3a²"}
            </code>
          </div>
          <div>
            <span>{t("Көлемі", "Объём", "Volume")}</span>
            <strong>
              {format(volume)}
              <small> {t("см³", "см³", "cm³")}</small>
            </strong>
            <code>
              {solid === "cube"
                ? "V = a³"
                : solid === "sphere"
                  ? "V = ⁴⁄₃πr³"
                  : "V = a³ / (6√2)"}
            </code>
          </div>
        </div>
        <p className="gm-lab-tip">
          <Sparkles size={16} />
          {t(
            "Қырды 2 есе арттырсаң, көлем 8 есе өседі. Тексеріп көр!",
            "Увеличь размер в 2 раза — объём вырастет в 8. Проверь!",
            "Double the size and the volume grows eightfold. Try it!",
          )}
        </p>
      </div>
    </div>
  );
}

export function DURYSTAPLanding() {
  const [language, setLanguage] = useState<Language>("kk");
  const [light, setLight] = useState(false);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [formStatus, setFormStatus] = useState(false);
  const t = copy(language);
  useEffect(() => {
    try {
      if (localStorage.getItem("geomind-theme") === "light")
        requestAnimationFrame(() => setLight(true));
    } catch {
      /* Storage is optional. */
    }
  }, []);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const toggleTheme = () => {
    setLight(!light);
    try {
      localStorage.setItem("geomind-theme", !light ? "light" : "dark");
    } catch {
      /* The toggle still works in memory. */
    }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = `DURYSTAP курсына қызығушылық\nАты: ${data.get("name")}\nКурс бағасы: 50 000 ₸\nСұрақ: ${data.get("message") || "Курсқа қалай қосыламын?"}`;
    window.open(
      `${WHATSAPP_URL}?text=${encodeURIComponent(body)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setFormStatus(true);
  };
  const faq = [
    [
      t(
        "Курс кімдерге арналған?",
        "Кому подойдёт курс?",
        "Who is the course for?",
      ),
      t(
        "Математика емтихандарына дайындалып жүрген және геометрияны жүйелі түсінгісі келетін оқушыларға арналған. Негізгі ұғымдардан бастаймыз.",
        "Для школьников, которые готовятся к экзаменам по математике и хотят системно разобраться в геометрии. Начинаем с основ.",
        "For students preparing for mathematics exams who want to understand geometry step by step. We start with the foundations.",
      ),
    ],
    [
      t(
        "Базам әлсіз болса, үлгере аламын ба?",
        "А если у меня слабая база?",
        "What if I struggle with the basics?",
      ),
      t(
        "Иә. Тақырыптар бірізді құрылған. Видеоны тоқтатып, қайта көріп, мысалдарды өз қарқыныңмен талдай аласың.",
        "Да. Темы идут последовательно. Останавливай видео, пересматривай и разбирай примеры в своём темпе.",
        "Yes. Topics build on one another. Pause, replay and work through examples at your own pace.",
      ),
    ],
    [
      t(
        "Сабақтар қай тілде өтеді?",
        "На каком языке проходят уроки?",
        "What language are lessons in?",
      ),
      t(
        "Сабақтар мен оқу материалдары қазақ тілінде. Сайт тілін ауыстыру сабақтардың тілін өзгертпейді.",
        "Уроки и учебные материалы — на казахском. Язык сайта не меняет язык уроков.",
        "Lessons and learning materials are in Kazakh. Changing the site language does not change the lesson language.",
      ),
    ],
    [
      t(
        "Курсқа қалай қосыламын?",
        "Как получить доступ?",
        "How do I get access?",
      ),
      t(
        "Төмендегі форма арқылы хабарлас. Курс бағасы — 50 000 ₸. Қосылу шарттарын нақтылаған соң, Google аккаунтыңмен кіресің. Әкімші осы email-ға қолжетімділік береді.",
        "Свяжись с нами через форму ниже. Цена — 50 000 ₸. После согласования условий войди через Google. Администратор откроет доступ для этого email.",
        "Contact us using the form below. The course costs 50,000 ₸. Once the enrollment terms are confirmed, sign in with Google. The administrator grants access to that email.",
      ),
    ],
    [
      t(
        "Курсқа қолжетімділік қанша уақытқа беріледі?",
        "На какой срок открывается доступ?",
        "How long do I have access?",
      ),
      t(
        "Қолжетімділік мерзімі қосылу кезінде нақтыланады. Сатып алмас бұрын барлық шарттарды біле аласың.",
        "Срок доступа уточняется при записи. Все условия можно узнать до оплаты.",
        "Your access period is confirmed during enrollment. All terms are available before payment.",
      ),
    ],
  ];
  const nav = [
    ["#why", t("Артықшылықтар", "Преимущества", "Why DURYSTAP")],
    ["#program", t("Бағдарлама", "Программа", "Curriculum")],
    ["#lab", "3D " + t("зертхана", "лаборатория", "lab")],
    ["#pricing", t("Бағасы", "Стоимость", "Pricing")],
  ];
  return (
    <div
      className={`geomind ${light ? "gm-light" : ""}`}
      lang={language}
      id="top"
    >
      <LandingMotion paused={paused} />
      <div className="gm-cursor" aria-hidden="true" />
      <header className="gm-nav-wrap">
        <nav
          className="gm-nav"
          aria-label={t(
            "Басты навигация",
            "Основная навигация",
            "Main navigation",
          )}
        >
          <Brand />
          <div className="gm-desktop-links">
            {nav.map(([href, name]) => (
              <a key={href} href={href}>
                {name}
              </a>
            ))}
          </div>
          <div className="gm-nav-actions">
            <button
              className="gm-icon-button"
              onClick={toggleTheme}
              aria-label={t(
                "Түстер режимін ауыстыру",
                "Сменить тему",
                "Toggle color theme",
              )}
              aria-pressed={light}
            >
              {light ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <Link className="gm-login" href="/login">
              {t("Кіру", "Войти", "Log in")}
              <ArrowUpRight size={16} />
            </Link>
            <button
              className="gm-menu-toggle gm-icon-button"
              aria-controls="gm-mobile-menu"
              aria-expanded={menuOpen}
              aria-label={t("Мәзір", "Меню", "Menu")}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </nav>
        {menuOpen && (
          <div id="gm-mobile-menu" className="gm-mobile-menu">
            {nav.map(([href, name]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>
                {name}
                <ArrowUpRight size={17} />
              </a>
            ))}
          </div>
        )}
      </header>

      <main id="main">
        <section className="gm-hero gm-container">
          <div className="gm-hero-copy">
            <div className="gm-pill">
              <span className="gm-live-dot" />
              {t(
                "ОЙЛАУДЫҢ ЖАҢА ӨЛШЕМІ",
                "НОВОЕ ИЗМЕРЕНИЕ МЫШЛЕНИЯ",
                "A NEW DIMENSION OF THINKING",
              )}
              <ArrowUpRight size={13} />
            </div>
            <h1 className="gm-hero-title">
              <span>{t("Геометрия.", "Геометрия.", "Geometry.")}</span>
              <span>{t("Жаңа", "В новом", "In a new")}</span>
              <span className="gm-gradient-text">
                {t("өлшемде.", "измерении.", "dimension.")}
                <span className="gm-title-spark" aria-hidden="true">
                  ✳
                </span>
              </span>
            </h1>
            <p className="gm-hero-description">
              {t(
                "Формулаларды жаттама. Олардың мәнін көр.",
                "Не заучивай формулы. Увидь их смысл.",
                "Don't memorize formulas. See what they mean.",
              )}
              <br />
              {t(
                "Геометрияны 3D, видео және практика арқылы түсініп үйрен.",
                "Пойми геометрию через 3D, видео и практику.",
                "Understand geometry through 3D, video and practice.",
              )}
            </p>
            <div className="gm-hero-buttons">
              <a
                className="gm-button gm-button-lime"
                href="#pricing"
                data-magnetic
              >
                {t("Оқуды бастау", "Начать учиться", "Start learning")}
                <ArrowUpRight size={19} />
              </a>
              <a className="gm-button gm-button-ghost" href="#lab">
                <span className="gm-play-circle">
                  <Play size={12} fill="currentColor" />
                </span>
                {t("3D-ді байқап көр", "Попробовать 3D", "Explore in 3D")}
              </a>
            </div>
            <div className="gm-hero-benefits">
              <span>
                <Check size={13} />
                {t("Қазақ тілінде", "На казахском", "In Kazakh")}
              </span>
              <span>
                <Check size={13} />
                {t("Өз қарқыныңмен", "В своём темпе", "At your own pace")}
              </span>
              <span>
                <Check size={13} />
                {t("Кез келген жерден", "Из любой точки", "From anywhere")}
              </span>
            </div>
          </div>
          <div className="gm-hero-art">
            <div className="gm-art-grid" aria-hidden="true" />
            <span className="gm-art-coordinate gm-mono">
              FIG. 01 / ICOSAHEDRON
            </span>
            <GeometryScene paused={paused} />
            <div className="gm-float-label gm-label-top">
              <span className="gm-label-icon">
                <Triangle size={17} />
              </span>
              <div>
                <small>
                  {t(
                    "ЖАЙ ҒАНА ФИГУРА ЕМЕС",
                    "БОЛЬШЕ, ЧЕМ ФИГУРА",
                    "MORE THAN A SHAPE",
                  )}
                </small>
                <strong>
                  {t(
                    "Ойлаудың жаңа қыры",
                    "Новая грань мышления",
                    "A new angle on thinking",
                  )}
                </strong>
              </div>
            </div>
            <div className="gm-float-label gm-label-bottom">
              <div>
                <small>
                  {t("ЭЙЛЕР ФОРМУЛАСЫ", "ФОРМУЛА ЭЙЛЕРА", "EULER'S FORMULA")}
                </small>
                <strong className="gm-mono">V − E + F = 2</strong>
              </div>
              <span className="gm-label-plus">+</span>
            </div>
            <button
              className="gm-motion-toggle"
              aria-pressed={paused}
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play size={12} /> : <Pause size={12} />}
              {paused
                ? t("Қозғалысты қосу", "Включить движение", "Enable motion")
                : t(
                    "Қозғалысты тоқтату",
                    "Остановить движение",
                    "Pause motion",
                  )}
            </button>
          </div>
          <div className="gm-hero-bottom">
            <span className="gm-mono">
              {t(
                "ЖАЗЫҚТЫҚТАН — МҮМКІНДІККЕ",
                "ОТ ПЛОСКОСТИ — К ВОЗМОЖНОСТЯМ",
                "FROM PLANES TO POSSIBILITIES",
              )}
            </span>
            <a href="#why">
              {t("Төмен қарай зертте", "Исследуй дальше", "Scroll to explore")}
              <ArrowDown size={14} />
            </a>
          </div>
        </section>

        <section
          className="gm-stats"
          aria-label={t(
            "Курс туралы сандар",
            "Курс в цифрах",
            "Course at a glance",
          )}
        >
          <div className="gm-container gm-stats-grid">
            {[
              [
                String(courseProgram.length),
                t("негізгі бөлім", "основных раздела", "core sections"),
              ],
              [
                "3",
                t(
                  "өлшемді зертхана",
                  "измерения в лаборатории",
                  "dimensions to explore",
                ),
              ],
              [
                "4",
                t(
                  "қадамдық оқу жүйесі",
                  "шага в системе обучения",
                  "steps to understanding",
                ),
              ],
              [
                "100",
                t(
                  "қазақша түсіндіру",
                  "объяснение на казахском",
                  "Kazakh-language teaching",
                ),
              ],
            ].map(([n, title], i) => (
              <div key={title} className="gm-stat">
                <strong>
                  <span data-count={n}>{n.padStart(2, "0")}</span>
                  <span>{i === 1 ? "D" : i === 3 ? "%" : ""}</span>
                </strong>
                <p>{title}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="why" className="gm-section gm-container">
          <div className="gm-section-heading" data-reveal>
            <div>
              <span className="gm-eyebrow">
                01 / {t("НЕГЕ DURYSTAP?", "ПОЧЕМУ DURYSTAP?", "WHY DURYSTAP?")}
              </span>
              <h2>
                {t("Формуланы білесің.", "Кажется сложным.", "Looks complex.")}
                <br />
                <span>
                  {t(
                    "Есеп неге шықпайды?",
                    "Поймёшь — станет проще.",
                    "Feels simple.",
                  )}
                </span>
              </h2>
            </div>
            <p>
              {t(
                "Мәселе қабілетіңде емес. Сызбаны түсіну, дұрыс тәсілді таңдау және өзің шешіп көру — үшеуін бірге үйрену керек. DURYSTAP-та осы жолмен жүреміз.",
                "За каждой формулой — целый мир. Откроем его вместе.",
                "There is a whole world behind every formula. Let's explore it together.",
              )}
            </p>
          </div>
          <div className="gm-bento">
            <article
              className="gm-bento-card gm-bento-visual"
              data-tilt
              data-reveal
            >
              <div className="gm-card-top">
                <span className="gm-small-icon">
                  <Box size={19} />
                </span>
                <span className="gm-tag">3D VISUALIZATION</span>
              </div>
              <div className="gm-wire-art" aria-hidden="true">
                <svg viewBox="0 0 320 180" fill="none">
                  <defs>
                    <linearGradient id="geo-fill">
                      <stop stopColor="#2ee59d" stopOpacity=".2" />
                      <stop offset="1" stopColor="#2ee59d" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="m160 12 92 52v86l-92 26-92-52V38Z"
                    fill="url(#geo-fill)"
                    stroke="#2ee59d"
                  />
                  <path
                    d="m68 38 92 52 92-26M160 90v86M160 12v82l92 56M68 124l92-30"
                    stroke="#a7f3d0"
                    strokeOpacity=".5"
                  />
                  <ellipse
                    cx="160"
                    cy="113"
                    rx="150"
                    ry="40"
                    stroke="#2ee59d"
                    strokeOpacity=".25"
                    transform="rotate(-15 160 113)"
                  />
                  <circle cx="68" cy="38" r="4" fill="#c6ff4d" />
                  <circle cx="252" cy="150" r="4" fill="#c6ff4d" />
                </svg>
                <span className="gm-art-formula">a² + b² = c²</span>
              </div>
              <h3>
                {t(
                  "Сызбаға қарап, неден бастарыңды білмейсің бе?",
                  "Смотри. Вращай. Понимай.",
                  "See. Rotate. Understand.",
                )}
              </h3>
              <p>
                {t(
                  "Есептің берілгенін сызбаға түсіріп, қандай қасиет көмектесетінін қадамдап талдаймыз. Дайын формуладан бұрын оның неге қажет екенін түсінесің.",
                  "Выйди за рамки плоских схем. Исследуй фигуру со всех сторон.",
                  "Go beyond flat diagrams. Explore shapes from every angle.",
                )}
              </p>
              <a className="gm-text-link" href="#lab">
                {t("Зертханаға өту", "Открыть лабораторию", "Enter the lab")}
                <ArrowUpRight size={16} />
              </a>
            </article>
            <article className="gm-bento-card" data-tilt data-reveal>
              <div className="gm-card-top">
                <span className="gm-small-icon">
                  <Play size={19} />
                </span>
                <span className="gm-mono">01 → 02 → 03</span>
              </div>
              <div className="gm-video-preview" aria-hidden="true">
                <div className="gm-video-triangle">
                  △<span>α</span>
                </div>
                <div className="gm-video-track">
                  <i />
                  <Play size={11} />
                </div>
              </div>
              <h3>
                {t(
                  "Базаң әлсіз болса, қайдан бастайсың?",
                  "Меньше времени. Больше ясности.",
                  "Less time. More clarity.",
                )}
              </h3>
              <p>
                {t(
                  "10 база қалыптастыру сабағынан баста. Әрі қарай планиметриядан стереометрияға дейін ретімен өт. Түсінбеген жеріңді қайта көр — ешкімнің қарқынына ілесу міндет емес.",
                  "Короткое видео, понятный пример. Пересматривай и учись в своём темпе.",
                  "Focused videos. Clear examples. Replay any moment at your own pace.",
                )}
              </p>
            </article>
            <article
              className="gm-bento-card gm-practice-card"
              data-tilt
              data-reveal
            >
              <span className="gm-small-icon">
                <FileText size={19} />
              </span>
              <h3>
                {t(
                  "Видеода түсінікті. Жалғыз қалсаң — қиын ба?",
                  "Закрепляй знания.",
                  "Make it stick.",
                )}
              </h3>
              <p>
                {t(
                  "Әр сабаққа жұмыс дәптері мен үй тапсырмасы беріледі. Алдымен өзің шеш, кейін шешімімен салыстыр. Қиналған сұрағыңды мұғалімге қой.",
                  "Превращай теорию в практику с PDF-заданиями.",
                  "Turn theory into practice with PDF exercises.",
                )}
              </p>
              <div className="gm-mini-file">
                <FileText size={22} />
                <div>
                  <strong>
                    {t("Үй тапсырмасы", "Домашнее задание", "Homework")}
                  </strong>
                  <span>
                    PDF ·{" "}
                    {t(
                      "Сыз. Шеш. Тексер.",
                      "Начерти. Реши. Проверь.",
                      "Draw. Solve. Check.",
                    )}
                  </span>
                </div>
                <ArrowDown size={16} />
              </div>
            </article>
            <article
              className="gm-bento-card gm-progress-card"
              data-tilt
              data-reveal
            >
              <div>
                <span className="gm-small-icon">
                  <GraduationCap size={19} />
                </span>
                <h3>
                  {t(
                    "Оқып жүрсің. Бірақ не меңгергенің белгісіз бе?",
                    "Каждый шаг — вперёд.",
                    "Every step is progress.",
                  )}
                </h3>
                <p>
                  {t(
                    "Апта сайынғы тест әлсіз тақырыптарыңды анықтауға көмектеседі. Жеке кабинетте аяқталған сабақтарды көріп, қайталауға қажет жерге орал.",
                    "Следи за пройденными уроками и продолжай с того же места.",
                    "Track completed lessons and continue where you left off.",
                  )}
                </p>
              </div>
              <div className="gm-progress-orbit" aria-hidden="true">
                <Check size={34} />
                <span>STEP BY STEP</span>
              </div>
            </article>
          </div>
          <div className="gm-learning-flow" data-reveal>
            {[
              t("Видео сабақ", "Видеоурок", "Video lesson"),
              t("Мысалдар", "Примеры", "Examples"),
              t("Үй тапсырмасы", "Практика", "Practice"),
              t("Келесі қадам", "Следующий шаг", "Next step"),
            ].map((item, i) => (
              <div key={item}>
                <span className="gm-mono">0{i + 1}</span>
                {item}
                {i < 3 && <ArrowRight size={17} />}
              </div>
            ))}
          </div>
        </section>

        <section id="program" className="gm-section gm-program-section">
          <div className="gm-container">
            <div className="gm-section-heading" data-reveal>
              <div>
                <span className="gm-eyebrow">
                  02 /{" "}
                  {t("КУРС БАҒДАРЛАМАСЫ", "ПРОГРАММА КУРСА", "THE CURRICULUM")}
                </span>
                <h2>
                  {t(
                    "Нүктеден баста.",
                    "Начни с точки.",
                    "Start with a point.",
                  )}
                  <br />
                  <span>
                    {t(
                      "Кеңістікті бағындыр.",
                      "Освой пространство.",
                      "Master the space.",
                    )}
                  </span>
                </h2>
              </div>
              <div>
                <p>
                  {t(
                    "Төрт негізгі бөлім: планиметрия, стереометрия және жазықтық пен кеңістіктегі аналитикалық геометрия.",
                    "Четыре раздела: планиметрия, стереометрия и аналитическая геометрия на плоскости и в пространстве.",
                    "Four core sections: plane geometry, solid geometry, and analytic geometry in two and three dimensions.",
                  )}
                </p>
                <span className="gm-tag gm-program-tag">
                  <BookOpen size={13} />
                  {t(
                    "ВИДЕО + ПРАКТИКА + PDF",
                    "ВИДЕО + ПРАКТИКА + PDF",
                    "VIDEO + PRACTICE + PDF",
                  )}
                </span>
              </div>
            </div>
            <div className="gm-modules">
              {courseProgram.map(
                ({ title, description, symbol, formula, topics }, index) => (
                  <details className="gm-module" key={index} data-reveal>
                    <summary>
                      <span className="gm-module-num">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="gm-module-symbol" aria-hidden="true">
                        {symbol}
                      </span>
                      <h3>{t(...title)}</h3>
                      <span className="gm-module-formula">{formula}</span>
                      <span className="gm-module-plus">
                        <Plus size={19} />
                      </span>
                    </summary>
                    <div className="gm-module-body">
                      <p>{t(...description)}</p>
                      <ol className="gm-topic-list" lang="kk">
                        {topics.map((topic) => (
                          <li key={topic.title}>
                            <h4>{topic.title}</h4>
                            {topic.lessons && (
                              <ol>
                                {topic.lessons.map((lesson) => (
                                  <li key={lesson}>{lesson}</li>
                                ))}
                              </ol>
                            )}
                          </li>
                        ))}
                      </ol>
                      <a href="#enroll">
                        {t(
                          "Осы курсты таңда",
                          "Выбрать этот курс",
                          "Choose this course",
                        )}
                        <ArrowUpRight size={16} />
                      </a>
                    </div>
                  </details>
                ),
              )}
            </div>
          </div>
        </section>

        <section id="lab" className="gm-section gm-container">
          <div className="gm-section-heading" data-reveal>
            <div>
              <span className="gm-eyebrow">
                03 / {t("3D ЗЕРТХАНА", "3D ЛАБОРАТОРИЯ", "THE 3D LAB")}
              </span>
              <h2>
                {t("Жай оқыма.", "Не просто читай.", "Don't just read.")}{" "}
                <span>{t("Байқап көр.", "Попробуй.", "Try it.")}</span>
              </h2>
            </div>
            <p>
              {t(
                "Интуицияңды тексер: қыр 2 есе артса, көлем де 2 есе өсе ме? Жауапты таңда, фигураны өзгерт, айырмашылықты өзің көр.",
                "Геометрия — не только на бумаге. Измени размер и посмотри, как изменится фигура.",
                "Geometry lives beyond the page. Change one dimension and watch the whole shape respond.",
              )}
            </p>
          </div>
          <Lab language={language} paused={paused} />
        </section>

        <section className="gm-section gm-container gm-people" id="teachers">
          <div className="gm-people-intro" data-reveal>
            <span className="gm-eyebrow">
              04 / {t("АДАМДАР МЕН ИДЕЯЛАР", "ЛЮДИ И ИДЕИ", "PEOPLE & IDEAS")}
            </span>
            <h2>
              {t("Түсіндіре білу —", "Уметь объяснять —", "Teaching is")}
              <br />
              <span>
                {t(
                  "өз алдына өнер.",
                  "особое искусство.",
                  "an art of its own.",
                )}
              </span>
            </h2>
            <p>
              {t(
                "Жақсы сабақ дайын жауап бермейді. Өз жауабыңды табуға көмектеседі.",
                "Хороший урок не даёт готовый ответ. Он помогает найти свой.",
                "A great lesson doesn't hand you the answer. It helps you find your own.",
              )}
            </p>
          </div>
          <div className="gm-people-cards">
            <article className="gm-person-card" data-reveal>
              <div className="gm-teacher-photo">
                <Image
                  src="/images/qazbek.png"
                  alt="Қазбек — геометрия курсының мұғалімі"
                  width={500}
                  height={500}
                  sizes="(max-width: 600px) 240px, 180px"
                />
              </div>
              <div>
                <span className="gm-eyebrow">
                  {t("КУРС МҰҒАЛІМДЕРІ", "ПРЕПОДАВАТЕЛИ", "YOUR TEACHERS")}
                </span>
                <h3>{t("Қазбек", "Казбек", "Qazbek")}</h3>
                <p>
                  {t(
                    "SDU университетінде математика мұғалімдігі бойынша бакалавр мен магистратураны аяқтағанмын. 5 000-нан астам оқушы оқыттым.",
                    "Окончил бакалавриат и магистратуру SDU по подготовке учителей математики. Обучил более 5 000 учеников.",
                    "I hold bachelor’s and master’s degrees in mathematics teacher education from SDU. I have taught more than 5,000 students.",
                  )}
                </p>
                <p>
                  {t(
                    "Оқушыларымның арасында 50/50 алғандар бар. Түлектерім SDU, KBTU және Қазақстанның басқа жетекші университеттерінде, сондай-ақ Қытайда, Италияда және АҚШ-та оқиды.",
                    "Среди моих учеников есть набравшие 50/50. Выпускники учатся в SDU, KBTU и других ведущих вузах Казахстана, а также в Китае, Италии и США.",
                    "My students include learners who scored 50/50. Graduates study at SDU, KBTU and other leading universities in Kazakhstan, as well as in China, Italy and the USA.",
                  )}
                </p>
                <div className="gm-teacher-facts">
                  <span>5 000+ {t("оқушы", "учеников", "students")}</span>
                  <span>
                    SDU ·{" "}
                    {t(
                      "бакалавр + магистр",
                      "бакалавр + магистр",
                      "bachelor’s + master’s",
                    )}
                  </span>
                </div>
              </div>
            </article>
            <article className="gm-quote-card" data-reveal>
              <GraduationCap size={32} />
              <span className="gm-eyebrow">
                {t("НАҚТЫ НӘТИЖЕЛЕР", "РЕАЛЬНЫЕ РЕЗУЛЬТАТЫ", "REAL RESULTS")}
              </span>
              <h3>
                {t(
                  "Математикадан 50/50. Бұл — Әсемгүлдің нәтижесі.",
                  "50/50 по математике. Результат Асемгуль.",
                  "50/50 in mathematics. Asemgul’s result.",
                )}
              </h3>
              <p>
                {t(
                  "Бір күндік шабыттан — жүйелі дайындыққа. Төменде Қазбектің оқушыларының 2025 жылғы ҰБТ нәтижелері.",
                  "От вдохновения — к системной подготовке. Ниже результаты учеников Казбека на ЕНТ 2025.",
                  "From inspiration to consistent preparation. See Qazbek’s students’ 2025 UNT results below.",
                )}
              </p>
              <a href="#results" className="gm-text-link">
                {t(
                  "Нәтижелерді көру",
                  "Посмотреть результаты",
                  "See the results",
                )}{" "}
                <ArrowDown size={17} />
              </a>
            </article>
          </div>
        </section>

        <section id="results" className="gm-section gm-container">
          <div className="gm-section-heading" data-reveal>
            <div>
              <span className="gm-eyebrow">
                {t(
                  "ОҚУШЫЛАР НӘТИЖЕСІ / ҰБТ 2025",
                  "РЕЗУЛЬТАТЫ УЧЕНИКОВ / ЕНТ 2025",
                  "STUDENT RESULTS / UNT 2025",
                )}
              </span>
              <h2>
                {t("Еңбектің", "Результат", "Consistent effort.")}{" "}
                <span>
                  {t("нақты нәтижесі.", "подготовки.", "Real results.")}
                </span>
              </h2>
            </div>
            <p>
              {t(
                "Қазбектің оқушылары. Мұғалім ұсынған ҰБТ құжаттарындағы балдар.",
                "Ученики Казбека. Баллы из предоставленных преподавателем документов ЕНТ.",
                "Qazbek’s students. Scores from UNT documents provided by their teacher.",
              )}
            </p>
          </div>
          <div className="gm-results-grid">
            {[
              { name: "Әсемгүл", math: 50, total: 134, date: "29.05.2025" },
              { name: "Нұрахмет", math: 45, total: 125, date: "30.05.2025" },
              { name: "Нұртас", math: 46, total: 123, date: "24.06.2025" },
              { name: "Сұлтан", math: 42, total: 111, date: "03.06.2025" },
            ].map((result) => (
              <article key={result.name} className="gm-result-card" data-reveal>
                <div className="gm-card-top">
                  <span className="gm-tag">
                    {t("МАТЕМАТИКА", "МАТЕМАТИКА", "MATHEMATICS")}
                  </span>
                  <GraduationCap size={20} />
                </div>
                <div className="gm-result-score">
                  {result.math}
                  <span>/50</span>
                </div>
                <h3>{result.name}</h3>
                <p>
                  {t("Жалпы балл", "Общий балл", "Total score")}{" "}
                  <strong>{result.total}/140</strong>
                </p>
                <span className="gm-result-date">{result.date} · ҰБТ</span>
              </article>
            ))}
          </div>
          <p className="gm-result-note">
            {t(
              "Бұл — жеке оқушылардың нәтижелері. Сенің нәтижең бастапқы дайындық пен тұрақты еңбегіңе байланысты.",
              "Это индивидуальные результаты. Твой результат зависит от начальной подготовки и регулярной работы.",
              "These are individual results. Your outcome depends on your starting level and consistent practice.",
            )}
          </p>
        </section>

        <section id="pricing" className="gm-section gm-pricing-section">
          <div className="gm-container">
            <div className="gm-center-heading" data-reveal>
              <span className="gm-eyebrow">
                05 /{" "}
                {t(
                  "ӨЗІҢЕ ИНВЕСТИЦИЯ",
                  "ИНВЕСТИЦИЯ В СЕБЯ",
                  "INVEST IN YOURSELF",
                )}
              </span>
              <h2>
                {t("Жаңа деңгейге", "На новый уровень", "Your next level")}
                <br />
                <span>
                  {t("бір қадам қалды.", "за один шаг.", "starts here.")}
                </span>
              </h2>
              <p>
                {t(
                  "Алдымен таныс. Сосын сенімді таңда.",
                  "Сначала познакомься. Затем выбирай уверенно.",
                  "Explore first. Choose with confidence.",
                )}
              </p>
            </div>
            <div className="gm-pricing-grid">
              <article className="gm-price-card gm-price-featured" data-reveal>
                <div className="gm-price-badge">
                  <Sparkles size={12} />
                  {t("ТОЛЫҚ КУРС", "ПОЛНЫЙ КУРС", "THE COMPLETE COURSE")}
                </div>
                <span className="gm-price-icon">
                  <Layers3 size={23} />
                </span>
                <h3>DURYSTAP</h3>
                <p>
                  {t(
                    "Түсіну, практика және қолдау — бәрі бір курста.",
                    "Понимание, практика и поддержка — в одном курсе.",
                    "Understanding, practice and support — in one course.",
                  )}
                </p>
                <strong className="gm-price gm-mono">
                  50 000 <span>₸</span>
                </strong>
                <span className="gm-price-note">
                  {t(
                    "Курс құны · мерзімін қосылғанда нақтылаймыз",
                    "Стоимость курса · срок уточняется при записи",
                    "Course price · access period confirmed at enrollment",
                  )}
                </span>
                <ul>
                  {[
                    t(
                      "4 негізгі бөлім · толық бағдарлама",
                      "4 раздела · полная программа",
                      "4 sections · complete curriculum",
                    ),
                    t(
                      "Қазақша видео сабақтар",
                      "Видеоуроки на казахском",
                      "Video lessons in Kazakh",
                    ),
                    t(
                      "Үй тапсырмалары + толық шешімдері",
                      "Домашние задания + полные решения",
                      "Homework + full solutions",
                    ),
                    t(
                      "Жеке кабинет және прогресс",
                      "Личный кабинет и прогресс",
                      "Your dashboard and progress",
                    ),
                    t(
                      "Әр апта сайын білімді бекітетін тест",
                      "Еженедельные тесты для закрепления",
                      "Weekly tests to consolidate learning",
                    ),
                    t(
                      "Әр сабаққа жеке жұмыс дәптері",
                      "Рабочая тетрадь к каждому уроку",
                      "A workbook for every lesson",
                    ),
                    t(
                      "Мұғаліммен байланыс",
                      "Связь с преподавателем",
                      "Contact with your teacher",
                    ),
                    t(
                      "База қалыптастыруға арналған 10 тегін сабақ",
                      "10 бесплатных уроков для формирования базы",
                      "10 free foundation-building lessons",
                    ),
                    t(
                      "Геометрияның барлық тарауы мен тақырыбы",
                      "Все разделы и темы геометрии",
                      "All geometry chapters and topics",
                    ),
                  ].map((text) => (
                    <li key={text}>
                      <Check size={16} />
                      {text}
                    </li>
                  ))}
                </ul>
                <a
                  href="#enroll"
                  className="gm-button gm-button-lime"
                  data-magnetic
                >
                  {t("Курсқа қосылу", "Записаться на курс", "Join the course")}
                  <ArrowUpRight size={17} />
                </a>
              </article>
              <article className="gm-price-card" data-reveal>
                <span className="gm-price-icon">
                  <MessageCircle size={23} />
                </span>
                <h3>
                  {t(
                    "Әлі сұрағың бар ма?",
                    "Остались вопросы?",
                    "Still have questions?",
                  )}
                </h3>
                <p>
                  {t(
                    "Таңдау жасамас бұрын бәрін нақтылап ал.",
                    "Уточни всё перед выбором.",
                    "Get the details before deciding.",
                  )}
                </p>
                <strong className="gm-price gm-price-chat">
                  {t("Сөйлесейік", "Обсудим", "Let's talk")}
                </strong>
                <span className="gm-price-note">
                  {t(
                    "Курс туралы ақпарат",
                    "Информация о курсе",
                    "Course information",
                  )}
                </span>
                <ul>
                  {[
                    t("Оқу форматы", "Формат обучения", "Learning format"),
                    t(
                      "Қолжетімділік мерзімі",
                      "Срок доступа",
                      "Access duration",
                    ),
                    t(
                      "Қосылу және төлем тәртібі",
                      "Запись и порядок оплаты",
                      "Enrollment and payment",
                    ),
                  ].map((text) => (
                    <li key={text}>
                      <Check size={16} />
                      {text}
                    </li>
                  ))}
                </ul>
                <a href="#enroll" className="gm-button gm-button-outline">
                  {t("Сұрақ қою", "Задать вопрос", "Ask a question")}
                  <ArrowUpRight size={17} />
                </a>
              </article>
            </div>
            <p className="gm-pricing-footnote">
              <Check size={14} />
              {t(
                "Сайтта автоматты төлем жоқ. Барлық шартты төлем жасамас бұрын нақтылаймыз.",
                "Автоматической оплаты на сайте нет. Все условия согласуются до оплаты.",
                "There is no automatic checkout. All terms are confirmed before payment.",
              )}
            </p>
          </div>
        </section>

        <section id="faq" className="gm-section gm-container gm-faq-section">
          <div data-reveal>
            <span className="gm-eyebrow">06 / FAQ</span>
            <h2>
              {t("Сұрақ бар ма?", "Есть вопросы?", "Curious?")}
              <br />
              <span>
                {t("Жауап осында.", "Ответы здесь.", "Answers here.")}
              </span>
            </h2>
            <p>
              {t(
                "Бастамас бұрын білгің келетіннің бәрі.",
                "Всё, что хочется знать перед стартом.",
                "Everything you'd like to know before starting.",
              )}
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="gm-text-link"
            >
              {t("Бізге жаз", "Напиши нам", "Write to us")}
              <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="gm-faq-list">
            {faq.map(([question, answer], i) => (
              <details key={i} data-reveal>
                <summary>
                  <span>{question}</span>
                  <Plus size={19} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="enroll" className="gm-container gm-enroll-wrap">
          <div className="gm-enroll" data-reveal>
            <div className="gm-enroll-copy">
              <span className="gm-eyebrow">
                <span className="gm-live-dot" />
                {t(
                  "СЕНІҢ ЖАҢА БАСТАУЫҢ",
                  "ТВОЁ НОВОЕ НАЧАЛО",
                  "YOUR FRESH START",
                )}
              </span>
              <h2>
                {t("Ойыңды аш.", "Раскрой мышление.", "Open your mind.")}
                <br />
                <span>
                  {t(
                    "Мүмкіндігіңді кеңейт.",
                    "Расширь возможности.",
                    "Expand your possibilities.",
                  )}
                </span>
              </h2>
              <p>
                {t(
                  "Алғашқы қадам үшін бәрін білу міндетті емес. Бастауға дайын болсаң жеткілікті.",
                  "Для первого шага не нужно знать всё. Достаточно быть готовым начать.",
                  "You don't need all the answers to take the first step. Just be ready to begin.",
                )}
              </p>
              <div className="gm-enroll-art" aria-hidden="true">
                ✳
                <span>
                  YOUR NEXT
                  <br />
                  DIMENSION.
                </span>
              </div>
            </div>
            <form className="gm-enroll-form" onSubmit={submit}>
              <h3>
                {t(
                  "Бірге бастайық.",
                  "Начнём вместе.",
                  "Let's begin together.",
                )}
              </h3>
              <label htmlFor="enroll-name">{t("Атың", "Имя", "Name")}</label>
              <input
                id="enroll-name"
                name="name"
                required
                maxLength={80}
                autoComplete="given-name"
                placeholder={t(
                  "Сені қалай атаймыз?",
                  "Как тебя зовут?",
                  "What should we call you?",
                )}
              />
              <label htmlFor="enroll-message">
                {t(
                  "Сұрағың (міндетті емес)",
                  "Вопрос (необязательно)",
                  "Question (optional)",
                )}
              </label>
              <textarea
                id="enroll-message"
                name="message"
                rows={2}
                maxLength={1000}
                placeholder={t(
                  "Нені білгің келеді?",
                  "Что хочешь узнать?",
                  "What would you like to know?",
                )}
              />
              <button className="gm-button gm-button-lime" type="submit">
                {t(
                  "WhatsApp арқылы хабарласу",
                  "Написать в WhatsApp",
                  "Contact on WhatsApp",
                )}
                <ArrowUpRight size={18} />
              </button>
              <p className="gm-form-note">
                {t(
                  "WhatsApp-та дайын хабарлама ашылады. Оны тексеріп, өзің жібересің. Бұл форма төлем жасамайды.",
                  "В WhatsApp откроется готовое сообщение. Проверь и отправь его сам. Форма не проводит оплату.",
                  "A draft opens in WhatsApp. Review and send it yourself. This form does not process payment.",
                )}
              </p>
              {formStatus && (
                <p className="gm-form-status" role="status">
                  {t(
                    "WhatsApp ашылмаса, +7 775 585 12 03 нөміріне жаз.",
                    "Если WhatsApp не открылся, напиши на +7 775 585 12 03.",
                    "If WhatsApp did not open, message +7 775 585 12 03.",
                  )}
                </p>
              )}
            </form>
          </div>
        </section>
      </main>

      <footer className="gm-footer gm-container">
        <div className="gm-footer-top">
          <div>
            <Brand />
            <p>
              {t(
                "Геометрияны жаттама. Түсін.",
                "Не заучивай геометрию. Понимай.",
                "Don't memorize geometry. Understand it.",
              )}
            </p>
          </div>
          <div className="gm-footer-links">
            <a href="#program">{t("Бағдарлама", "Программа", "Curriculum")}</a>
            <a href="#pricing">{t("Бағасы", "Стоимость", "Pricing")}</a>
            <a href="#faq">FAQ</a>
            <Link href="/login">
              {t("Жеке кабинет", "Личный кабинет", "Dashboard")}
              <ArrowUpRight size={13} />
            </Link>
          </div>
          <div
            className="gm-language-switch"
            role="group"
            aria-label={t("Сайт тілі", "Язык сайта", "Site language")}
          >
            <Globe2 size={15} />
            {(
              [
                ["kk", "KAZ"],
                ["ru", "RUS"],
                ["en", "ENG"],
              ] as const
            ).map(([value, name]) => (
              <button
                key={value}
                onClick={() => setLanguage(value)}
                aria-pressed={language === value}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        <div className="gm-footer-bottom">
          <span>© {new Date().getFullYear()} DURYSTAP · DURYSTAP Geometry</span>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={14} /> WhatsApp · +7 775 585 12 03
            <ArrowUpRight size={12} />
          </a>
          <span className="gm-made">
            {t(
              "ОЙЛА. ТҮСІН. ӨС.",
              "ДУМАЙ. ПОНИМАЙ. РАСТИ.",
              "THINK. UNDERSTAND. GROW.",
            )}
            <span>✳</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
