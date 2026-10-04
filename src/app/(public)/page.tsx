import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Plus,
  Play,
  FileText,
  Check,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button";
import { GeometryVisual } from "@/components/course/geometry-visual";

const pain = [
  "Формуланы білесің, бірақ қай жерде қолданарыңды білмейсің.",
  "Сызбаға қарап неден бастау керегін түсінбей қаласың.",
  "Стереометрияда фигураны елестету қиын.",
  "Бір есепке тым көп уақыт кетеді.",
];
const syllabus = [
  [
    "Планиметрия",
    "Нүкте, түзу, кесінді және бұрыштар. Геометрия тілін түсінуден бастаймыз.",
  ],
  [
    "Үшбұрыштар",
    "Үшбұрыштың негізгі қасиеттері, Пифагор теоремасы және ұқсастық.",
  ],
  [
    "Төртбұрыштар",
    "Параллелограмм, ромб, тіктөртбұрыш және трапеция. Қасиеттерден есеп шешіміне.",
  ],
  [
    "Шеңбер",
    "Хорда, жанама, доға және іштей сызылған бұрыштар арасындағы байланыс.",
  ],
  [
    "Координаталық геометрия",
    "Координаталар, векторлар және арақашықтық. Алгебра мен геометрияның тоғысуы.",
  ],
  [
    "Стереометрия",
    "Кеңістіктегі түзулер мен жазықтықтар, олардың орналасуы және қималар.",
  ],
  [
    "Призма және пирамида",
    "Көпжақтардың қасиеттері, бетінің ауданы мен көлемі.",
  ],
  [
    "Цилиндр, конус және шар",
    "Айналу денелерін түсіну. Аудан, көлем және кеңістіктегі байланыстар.",
  ],
];
const faq = [
  [
    "Курс кімдерге арналған?",
    "Математика емтихандарына дайындалып жүрген және геометриядағы білімін жүйелегісі келетін оқушыларға арналған.",
  ],
  [
    "Геометриядан білімім әлсіз болса ше?",
    "Негізгі ұғымдардан бастаймыз. Сабақтарды қайта қарап, мысалдарды өз қарқыныңмен талдап шығуға болады.",
  ],
  [
    "Сабақтар қай тілде өтеді?",
    "Видео сабақтар, түсіндірулер және оқу материалдары қазақ тілінде беріледі.",
  ],
  [
    "Белгілі бір уақытта онлайн болуым керек пе?",
    "Жоқ. Алдын ала жазылған сабақтарды өзіңе ыңғайлы уақытта қарайсың. Тоқтаған жеріңнен жалғастырып, қажет тақырыпқа қайта орала аласың.",
  ],
  [
    "Курсқа қалай қол жеткіземін?",
    "Google аккаунтыңмен кір. Әкімші осы аккаунтқа курсқа рұқсат берген соң, сабақтар жеке кабинетіңде ашылады.",
  ],
];
export default function HomePage() {
  return (
    <main id="main">
      <section id="about" className="landing-hero">
        <Container>
          <div className="grid items-center gap-2 lg:grid-cols-[1.15fr_1fr]">
            <div className="relative z-10 landing-enter">
              <p className="section-eyebrow">Геометрия. Басқаша көзқарас.</p>
              <h1 className="hero-heading">
                Геометрияны
                <br />
                <span className="quiet">көріп емес,</span>
                <br />
                <em>түсініп үйрен.</em>
              </h1>
              <div className="mt-8 max-w-[360px] border-l border-brand/25 pl-5 lg:mt-10">
                <p className="text-[14px] leading-[1.9] text-muted">
                  Формуланы жаттаудан — есептің мәнін түсінуге. Видео сабақ,
                  көрнекі мысал және практика арқылы емтиханға сенімді дайындал.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/login">
                  Курсқа кіру <ArrowUpRight size={17} />
                </ButtonLink>
                <ButtonLink href="#program" variant="ghost">
                  Бағдарламаны көру <ArrowDown size={15} />
                </ButtonLink>
              </div>
            </div>
            <div className="relative mt-6 lg:-ml-10 lg:mt-0 lg:w-[calc(100%+50px)]">
              <GeometryVisual />
            </div>
          </div>
          <div className="hero-note">
            <span>01 — ТҮСІНУДІҢ ЖАҢА ӨЛШЕМІ</span>
            <div className="flex flex-wrap justify-end gap-5">
              <span>Қазақ тілінде</span>
              <span className="hidden sm:inline">Өз қарқыныңмен</span>
              <span>Онлайн формат</span>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-space">
        <Container>
          <div className="mb-14 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="section-eyebrow">Оқуға арналған кеңістік</p>
              <h2 className="section-title">
                Жаттау емес.
                <br />
                Түсіну маңызды.
              </h2>
            </div>
            <p className="max-w-sm self-end text-sm leading-7 text-muted lg:justify-self-end">
              Әр бөлшегі бір мақсатқа қызмет етеді: геометрияны анық көріп, өз
              бетіңше есеп шығара білу.
            </p>
          </div>
          <div className="benefit-grid">
            <article className="benefit-panel bg-brand-dark text-white">
              <div className="mb-10 flex items-center justify-between text-[10px] tracking-[.15em] text-white/65">
                <span>01 / ВИДЕО САБАҚ</span>
                <Play size={16} />
              </div>
              <div
                aria-hidden="true"
                className="relative mb-9 flex h-28 items-center justify-center"
              >
                <div className="absolute h-32 w-56 -rotate-12 rounded-full border border-white/15" />
                <div className="absolute h-32 w-56 rotate-12 rounded-full border border-lime/30" />
                <span className="flex size-16 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur">
                  <Play size={21} fill="currentColor" />
                </span>
              </div>
              <h3>Бір сабақ. Бір анық ой.</h3>
              <p className="mt-4 text-white/70">
                Қысқа әрі мазмұнды видео сабақтар. Артық ақпаратсыз, тақырыптың
                мәніне назар аудар.
              </p>
            </article>
            <article className="benefit-panel bg-white">
              <div className="mb-10 flex justify-between text-[10px] tracking-[.15em] text-muted">
                <span>02 / ҚАДАМДЫҚ ТҮСІНДІРУ</span>
                <ArrowUpRight size={16} />
              </div>
              <div
                aria-hidden="true"
                className="mb-7 flex h-32 items-center gap-3 font-display text-4xl tracking-tight"
              >
                <span className="text-ink/20">?</span>
                <span className="h-px flex-1 bg-line" />
                <span className="text-ink/45">α</span>
                <span className="h-px flex-1 bg-line" />
                <span className="flex size-16 items-center justify-center rounded-full bg-lime/50 text-brand">
                  <Check size={24} />
                </span>
              </div>
              <h3>Шешімнің артындағы логика.</h3>
              <p className="mt-4 text-muted">
                Не істегенімізді ғана емес, неліктен солай істегенімізді бірге
                талдаймыз.
              </p>
            </article>
            <article className="benefit-panel bg-[#eceee8]">
              <div className="flex justify-between text-[10px] tracking-[.15em] text-muted">
                <span>03 / PDF ПРАКТИКА</span>
                <FileText size={16} />
              </div>
              <div className="mt-9 grid items-end gap-5 sm:grid-cols-[1fr_140px]">
                <div>
                  <h3>Білімді іске айналдыр.</h3>
                  <p className="mt-4 text-muted">
                    Сабақтан кейінгі тапсырмалар. Жүктеп ал, сыз, шеш және
                    біліміңді бекіт.
                  </p>
                </div>
                <div
                  aria-hidden="true"
                  className="hidden rotate-6 rounded-xl border border-white bg-white/80 p-5 shadow-card sm:block"
                >
                  <span className="text-[8px] tracking-widest text-muted">
                    DURYSTAP / ПРАКТИКА
                  </span>
                  <svg viewBox="0 0 100 85" className="my-3 w-full" fill="none">
                    <path d="M15 68 50 12l35 56H15Z" stroke="#496143" />
                    <path
                      d="M50 12v56"
                      stroke="#9aae8c"
                      strokeDasharray="3 4"
                    />
                  </svg>
                  <div className="h-px w-full bg-line" />
                  <div className="mt-2 h-px w-2/3 bg-line" />
                </div>
              </div>
            </article>
            <article className="benefit-panel bg-[#e5eed9]">
              <div className="flex justify-between text-[10px] tracking-[.15em] text-muted">
                <span>04 / ЖЕКЕ ПРОГРЕСС</span>
                <ArrowUpRight size={16} />
              </div>
              <div className="mt-9 flex items-center gap-6">
                <div className="min-w-0">
                  <h3>
                    Өз жолың.
                    <br />
                    Өз қарқының.
                  </h3>
                  <p className="mt-4 text-muted">
                    Аяқталған сабақтар мен келесі қадамың — бір жеке кабинетте.
                  </p>
                </div>
                <svg
                  viewBox="0 0 120 120"
                  className="hidden w-28 shrink-0 sm:block"
                  aria-hidden="true"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="#cbd8bf"
                    strokeWidth="3"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="#376144"
                    strokeWidth="3"
                    strokeDasharray="210 302"
                    transform="rotate(-90 60 60)"
                  />
                  <path
                    d="m44 60 10 10 23-23"
                    fill="none"
                    stroke="#376144"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </article>
          </div>
        </Container>
      </section>

      <section className="problem-section section-space">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-24">
            <div>
              <p className="section-eyebrow text-white/60">Таныс жағдай ма?</p>
              <h2 className="section-title">
                Геометрия
                <br />
                қиын емес.
                <br />
                <span className="text-lime">Жүйесіз оқу қиын.</span>
              </h2>
              <p className="mt-8 max-w-sm text-sm leading-7 text-white/65">
                Мәселе қабілетте емес. Тақырыптар арасындағы байланысты көруге
                көмектесетін жүйе қажет.
              </p>
              <span
                aria-hidden="true"
                className="mt-12 hidden font-display text-8xl font-extralight text-white/15 lg:block"
              >
                ∴
              </span>
            </div>
            <ol>
              {pain.map((text, i) => (
                <li key={text} className="problem-row">
                  <span className="text-[11px] text-white/45">0{i + 1}</span>
                  <p className="text-[15px] leading-7">{text}</p>
                  <ArrowUpRight size={15} className="text-white/35" />
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section id="approach" className="section-space">
        <Container>
          <div className="mb-20 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="section-eyebrow">Оқу жүйесі</p>
              <h2 className="section-title">
                Түсінікті қадамдар.
                <br />
                Тұтас нәтиже.
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-7 text-muted">
              Әр сабақ — келесі тақырыпқа тірек.
              <br />
              Асықпай, бірақ жүйелі алға жылжы.
            </p>
          </div>
          <div className="flow-track">
            {[
              [
                "Түсіну",
                "Тақырыптың негізгі идеясын және оның не үшін қажет екенін біл.",
              ],
              ["Көру", "Сызба мен көрнекі мысалдардан байланысты байқа."],
              ["Шешу", "Қадамдық мысалдан өз бетіңше практикаға өт."],
              ["Бекіту", "Үй тапсырмасын орындап, келесі сабаққа дайын бол."],
            ].map(([title, text], i) => (
              <div key={title} className="flow-step">
                <div className="mb-6 flex items-center justify-between">
                  <span className="font-display text-4xl font-normal tracking-tight text-ink/25">
                    0{i + 1}
                  </span>
                  {i < 3 && (
                    <ArrowRight
                      size={18}
                      className="hidden text-muted md:block"
                    />
                  )}
                </div>
                <h3 className="text-2xl font-medium tracking-tight">{title}</h3>
                <p className="mt-4 max-w-[235px] text-[13px] leading-7 text-muted">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section
        id="program"
        className="border-y border-line bg-[#f0f3e9] section-space"
      >
        <Container>
          <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
            <div className="self-start lg:sticky lg:top-36">
              <p className="section-eyebrow">Курс бағдарламасы / 08 бөлім</p>
              <h2 className="section-title">
                Бір нүктеден —<br />
                кеңістікке.
              </h2>
              <p className="mt-7 max-w-xs text-sm leading-7 text-muted">
                Негізгі ұғымдардан көлемді фигураларға дейінгі бірізді оқу жолы.
              </p>
              <ButtonLink href="/login" variant="secondary" className="mt-8">
                Оқуды бастау <ArrowUpRight size={16} />
              </ButtonLink>
              <p className="mt-6 max-w-xs text-[11px] leading-6 text-muted">
                Толық сабақтар мен олардың саны курсқа кіргенде көрсетіледі.
              </p>
            </div>
            <div>
              {syllabus.map(([title, text], i) => (
                <details key={title} className="syllabus-row" open={i === 0}>
                  <summary>
                    <span className="syllabus-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-lg font-medium tracking-tight sm:text-xl">
                      {title}
                    </span>
                    <Plus size={19} />
                  </summary>
                  <div className="syllabus-body">
                    <p>{text}</p>
                    <div className="mt-5 flex flex-wrap gap-4 text-[10px] tracking-wide">
                      <span>ВИДЕО САБАҚ</span>
                      <span>·</span>
                      <span>ПРАКТИКА</span>
                      <span>·</span>
                      <span>ҮЙ ТАПСЫРМАСЫ</span>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section id="faq" className="section-space">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
            <div>
              <p className="section-eyebrow">Жиі қойылатын сұрақтар</p>
              <h2 className="section-title">Бастамас бұрын.</h2>
            </div>
            <div>
              {faq.map(([q, a]) => (
                <details key={q} className="syllabus-row">
                  <summary className="!grid-cols-[1fr_24px]">
                    <span className="font-display text-base font-medium sm:text-lg">
                      {q}
                    </span>
                    <Plus size={18} />
                  </summary>
                  <div className="syllabus-body !pl-0">
                    <p>{a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="pb-20 sm:pb-28">
        <Container>
          <div className="cta-installation">
            <div className="relative z-10 max-w-2xl">
              <p className="section-eyebrow">Келесі қадам — сенікі</p>
              <h2 className="section-title">
                Геометрияны дұрыс
                <br />
                түсінуден баста.
              </h2>
              <p className="mb-8 mt-6 max-w-sm text-sm leading-7 text-muted">
                Әр есептің шешімі бар.
                <br />
                Оны көруді бірге үйренейік.
              </p>
              <ButtonLink href="/login">
                Курсқа кіру <ArrowUpRight size={17} />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
