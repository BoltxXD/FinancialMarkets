'use client';
/* Browser location and saved sheet settings synchronize through effects. */
/* eslint-disable react-hooks/set-state-in-effect, @next/next/no-html-link-for-pages */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BarChart3, BookOpen, ChevronDown, FileText, Filter, Menu, Search, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DEMO, parseHoldings, summarize, validateSheetURL, type Holding } from '@/lib/portfolio';
import type { Report, SiteContent } from '@/lib/site-content';
import { sectors } from '@/lib/club-data';

const nav = [
  ['home', 'Home'], ['portfolio', 'Portfolio'], ['research', 'Research'],
  ['sectors', 'Sectors'], ['leadership', 'Leadership'], ['about', 'About'],
] as const;
const ranges = ['1M', '3M', '6M', 'YTD', '1Y', 'ALL'];
const chartData = [
  { date: 'Jan', portfolio: 10000, benchmark: 10000 }, { date: 'Feb', portfolio: 10085, benchmark: 10042 },
  { date: 'Mar', portfolio: 10030, benchmark: 10110 }, { date: 'Apr', portfolio: 10210, benchmark: 10170 },
  { date: 'May', portfolio: 10345, benchmark: 10280 }, { date: 'Jun', portfolio: 10475, benchmark: 10320 },
];
const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

type View = typeof nav[number][0];

function Brand() {
  return <span className="fmc-brand"><span className="fmc-mark"><img src="/mths-falcon.png" alt="" /></span><span><strong>Financial Markets Club</strong><small>MONROE TOWNSHIP HIGH SCHOOL</small></span></span>;
}

function PortfolioValue({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(10000);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }
    let frame = 0;
    const timer = window.setTimeout(() => {
      const startTime = performance.now();
      const update = (time: number) => {
        const progress = Math.min((time - startTime) / 900, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setDisplayValue(progress === 1 ? value : Math.round(10000 + (value - 10000) * eased));
        if (progress < 1) frame = requestAnimationFrame(update);
      };
      frame = requestAnimationFrame(update);
    }, 850);
    return () => { window.clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [value]);

  return <strong>{money(displayValue)}</strong>;
}

function PageIntro({ label, title, text }: { label: string; title: string; text: string }) {
  return <div className="fmc-page-intro"><span className="fmc-kicker">{label}</span><h1>{title}</h1><p>{text}</p></div>;
}

function PerformanceChart({ compact = false }: { compact?: boolean }) {
  const [range, setRange] = useState('ALL');
  const points = range === '1M' ? chartData.slice(-2) : range === '3M' ? chartData.slice(-3) : range === '6M' || range === 'YTD' || range === '1Y' ? chartData : chartData;
  const plot = (key: 'portfolio' | 'benchmark') => points.map((point, index) => `${36 + index * (628 / Math.max(points.length - 1, 1))},${205 - ((point[key] - 9900) / 750) * 170}`).join(' ');
  return <section className={`fmc-chart-panel${compact ? ' fmc-chart-compact' : ''}`} data-scroll-reveal aria-label="Illustrative portfolio performance chart">
    <div className="fmc-chart-heading"><div><span className="fmc-kicker">Performance</span><h3>Portfolio &amp; benchmark</h3></div><div className="fmc-chart-ranges" aria-label="Chart time range">{ranges.map(item => <button key={item} aria-pressed={range === item} onClick={() => setRange(item)}>{item}</button>)}</div></div>
    <div className="fmc-chart-legend"><span><i className="fmc-legend-portfolio" /> FMC portfolio</span><span><i className="fmc-legend-benchmark" /> S&amp;P 500</span><span className="fmc-chart-note">Illustrative demo path · not historical club results</span></div>
    <div className="fmc-chart"><svg viewBox="0 0 700 250" preserveAspectRatio="none" role="img" aria-label={`Illustrative FMC portfolio and S&P 500 values over ${range}`}>
      {[35, 90, 145, 200].map(y => <line key={y} x1="35" y1={y} x2="670" y2={y} stroke="var(--border)" strokeDasharray="3 5"/>)}
      <polyline className="fmc-main-benchmark-line" points={plot('benchmark')} fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeDasharray="5 5" vectorEffect="non-scaling-stroke"/>
      <polyline className="fmc-main-portfolio-line" points={plot('portfolio')} fill="none" stroke="var(--primary)" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/>
      {points.map((point, index) => { const x = 36 + index * (628 / Math.max(points.length - 1, 1)); const y = 205 - ((point.portfolio - 9900) / 750) * 170; return <g key={point.date}><circle cx={x} cy={y} r="4" fill="var(--primary)"><title>{`${point.date}: FMC ${money(point.portfolio)}; S&P 500 ${money(point.benchmark)} — illustrative`}</title></circle><text x={x} y="234" textAnchor="middle" fill="var(--muted-foreground)" fontSize="12">{point.date}</text></g>; })}
      <text x="0" y="39" fill="var(--muted-foreground)" fontSize="12">$10.6k</text><text x="0" y="205" fill="var(--muted-foreground)" fontSize="12">$10.0k</text>
    </svg></div>
  </section>;
}

function ReportCard({ report, onSelect }: { report: Report; onSelect: (report: Report) => void }) {
  return <article className="fmc-report-row">
    <div className="fmc-report-copy"><div className="fmc-report-meta"><span className="fmc-ticker">{report.ticker}</span><span>{report.sector}</span><span>{report.sample ? 'Sample material' : report.type}</span></div>
      <h3>{report.title}</h3><p>{report.description}</p></div>
    <div className="fmc-report-action"><span className={`fmc-status fmc-status-${slug(report.status)}`}>{report.status}</span>
      <button className="fmc-text-link" onClick={() => onSelect(report)}>Read research <ArrowRight size={15} /></button></div>
  </article>;
}

export default function SiteExperience({ content }: { content: SiteContent }) {
  const [view, setView] = useState<View>('home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [holdings, setHoldings] = useState<Holding[]>(DEMO);
  const [cash, setCash] = useState<number>();
  const [connected, setConnected] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [researchQuery, setResearchQuery] = useState('');
  const [researchSector, setResearchSector] = useState('All sectors');
  const [researchStatus, setResearchStatus] = useState('All recommendations');
  const [researchSort, setResearchSort] = useState<'company' | 'sector' | 'return' | 'value'>('company');
  const requestId = useRef(0);
  const navRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const summary = useMemo(() => summarize(holdings, cash), [holdings, cash]);

  const go = useCallback((next: View) => {
    setView(next);
    setMobileOpen(false);
    const path = next === 'home' ? '/' : `/${next}`;
    history.pushState({ fmcView: next }, '', path);
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, []);

  useEffect(() => {
    const readLocation = () => {
      const parts = location.pathname.split('/').filter(Boolean);
      const path = parts[0] as View | undefined;
      setView(nav.some(([key]) => key === path) ? path! : 'home');
      if (path === 'portfolio' && parts[1]) {
        setSelectedHolding(holdings.find(holding => holding.ticker.toLowerCase() === parts[1].toLowerCase()) ?? null);
      } else {
        setSelectedHolding(null);
      }
      if (path === 'research' && parts[1]) {
        setSelectedReport(content.reports.find(report => slug(report.id) === parts[1] || slug(report.ticker) === parts[1]) ?? null);
      } else {
        setSelectedReport(null);
      }
    };
    const savedUrl = localStorage.getItem('mths-sheet-url');
    if (savedUrl) setSheetUrl(savedUrl);
    readLocation();
    window.addEventListener('popstate', readLocation);
    return () => window.removeEventListener('popstate', readLocation);
  }, [content.reports, holdings]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [mobileOpen]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>('[data-scroll-reveal]');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      targets.forEach(target => target.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14 });
    targets.forEach(target => observer.observe(target));
    return () => observer.disconnect();
  }, [view]);

  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;
    const active = navElement.querySelector<HTMLElement>(`[data-nav-id="${view}"]`);
    if (!active || navElement.classList.contains('fmc-nav-open')) return;
    const updateIndicator = () => {
      navElement.style.setProperty('--indicator-x', `${active.offsetLeft}px`);
      navElement.style.setProperty('--indicator-width', `${active.offsetWidth}px`);
    };
    const frame = requestAnimationFrame(updateIndicator);
    window.addEventListener('resize', updateIndicator);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [view]);

  const syncSheet = useCallback(async (url: string) => {
    const request = ++requestId.current;
    setSyncing(true);
    setSheetError('');
    try {
      const valid = validateSheetURL(url);
      const response = await fetch(valid, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Could not read the published sheet. Check its sharing settings.');
      const data = parseHoldings(await response.text());
      if (request !== requestId.current) return false;
      setHoldings(data.holdings); setCash(data.cash); setConnected(true); setSheetUrl(valid);
      return true;
    } catch (error) {
      if (request === requestId.current) setSheetError(error instanceof Error ? error.message : 'Could not load the sheet.');
      return false;
    } finally {
      if (request === requestId.current) setSyncing(false);
    }
  }, []);

  useEffect(() => {
    let savedUrl = content.sheetUrl;
    try {
      savedUrl = localStorage.getItem('mths-sheet-url') || savedUrl;
    } catch {
      // Continue with the site-wide published sheet setting.
    }
    if (!savedUrl) return;
    setSheetUrl(savedUrl);
    void syncSheet(savedUrl);
    const interval = window.setInterval(() => void syncSheet(savedUrl), 60000);
    return () => {
      window.clearInterval(interval);
      requestId.current++;
    };
  }, [content.sheetUrl, syncSheet]);

  const connectSheet = async () => {
    if (await syncSheet(sheetUrl)) {
      localStorage.setItem('mths-sheet-url', sheetUrl);
      setSheetOpen(false);
    }
  };

  const openReport = (report: Report) => {
    setSelectedReport(report);
    history.pushState({ fmcView: 'research', report: report.id }, '', `/research/${slug(report.id)}`);
  };

  const openHolding = (holding: Holding) => {
    setSelectedHolding(holding);
    history.pushState({ fmcView: 'portfolio', ticker: holding.ticker }, '', `/portfolio/${holding.ticker.toLowerCase()}`);
  };

  const closeReport = () => {
    setSelectedReport(null);
    if (location.pathname.startsWith('/research/')) history.pushState({ fmcView: 'research' }, '', '/research');
  };

  const closeHolding = () => {
    setSelectedHolding(null);
    if (location.pathname.startsWith('/portfolio/')) history.pushState({ fmcView: 'portfolio' }, '', '/portfolio');
  };

  const sortedHoldings = useMemo(() => [...holdings].sort((a, b) => {
    if (researchSort === 'sector') return a.sector.localeCompare(b.sector);
    if (researchSort === 'return') return ((b.price / b.cost) - 1) - ((a.price / a.cost) - 1);
    if (researchSort === 'value') return (b.shares * b.price) - (a.shares * a.price);
    return a.name.localeCompare(b.name);
  }), [holdings, researchSort]);

  const filteredReports = useMemo(() => content.reports.filter(report => {
    const query = researchQuery.trim().toLowerCase();
    return (!query || `${report.title} ${report.ticker} ${report.sector} ${report.description}`.toLowerCase().includes(query)) &&
      (researchSector === 'All sectors' || report.sector === researchSector) &&
      (researchStatus === 'All recommendations' || report.status === researchStatus);
  }), [content.reports, researchQuery, researchSector, researchStatus]);

  const renderHome = () => <>
    <section className="fmc-hero fmc-shell">
      <div className="fmc-hero-copy"><h1 className="fmc-hero-headline" aria-label="Financial Markets Club"><span className="fmc-headline-mask"><span>Financial</span></span><span className="fmc-headline-mask"><em>Markets Club</em></span></h1>
        <p className="fmc-hero-description">Student analysts researching public companies, discussing financial markets, and managing a $10,000 simulated investment portfolio.</p>
        <div className="fmc-actions fmc-hero-actions"><Button onClick={() => go('portfolio')}>View Portfolio <ArrowRight /></Button><Button variant="outline" onClick={() => go('research')}>Explore Research</Button></div>
      </div>
      <aside className="fmc-portfolio-preview fmc-dashboard-enter"><div className="fmc-preview-top"><div><span className="fmc-kicker">FMC student portfolio</span><span className="fmc-preview-label">Demo data · simulated holdings</span></div><BarChart3 size={20} /></div>
        <div className="fmc-preview-value"><span>Portfolio value</span><PortfolioValue value={summary.value}/><span className="fmc-gain fmc-preview-return">{pct(summary.percent)} <span>since $10,000 starting balance</span></span></div>
        <div className="fmc-mini-chart"><svg viewBox="0 0 520 140" role="img" aria-label="Illustrative demo portfolio value path"><path className="fmc-preview-line" pathLength="1" d="M0 112 C50 106 53 83 100 92 S160 88 196 75 S250 91 290 66 S345 76 376 48 S430 69 460 37 S493 49 520 20" fill="none" stroke="var(--primary)" strokeWidth="3"/><path className="fmc-preview-benchmark" pathLength="1" d="M0 127 C52 112 69 119 100 104 S160 101 195 93 S250 103 289 86 S345 92 376 71 S430 81 460 64 S492 69 520 52" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeDasharray="5 5"/></svg></div>
        <div className="fmc-preview-legend"><span><i className="fmc-legend-portfolio"/>FMC portfolio</span><span><i className="fmc-legend-benchmark"/>S&amp;P 500</span><span>Illustrative demo</span></div>
        <div className="fmc-preview-bottom"><span>Active positions <strong>{holdings.length}</strong></span><span>Largest position <strong>{[...holdings].sort((a,b)=>b.shares*b.price-a.shares*a.price)[0]?.ticker ?? '—'}</strong></span><button onClick={() => go('portfolio')}>View details <ArrowRight size={15}/></button></div>
      </aside>
    </section>
    <section className="fmc-stats fmc-shell" aria-label="Club overview" data-scroll-reveal data-stagger>{[["Starting paper capital", "$10,000", "Simulated portfolio"], ["Demo positions", holdings.length.toString().padStart(2, '0'), "Illustrative holdings"], ["Research library", content.reports.length.toString().padStart(2, '0'), "Includes sample materials"], ["Meeting cadence", "Weekly", "Student discussion"]].map(([label, value, note]) => <div key={label} data-stagger-item><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</section>
  </>;

  const renderPortfolio = () => <div className="fmc-shell fmc-page-view"><PageIntro label="Research · process · accountability" title="FMC Student Portfolio" text="A transparent view of the club’s simulated portfolio. This demonstration uses sample holdings and is not actual club performance." />
    <div className="fmc-disclosure"><ShieldCheck size={18}/><span><strong>Simulated portfolio for educational purposes.</strong> Demo values are illustrative. Connect a published holdings sheet to preview the club’s current positions.</span><span className="fmc-demo-pill">{connected ? 'Connected sheet' : 'Demo data'}</span></div>
    <div className="fmc-portfolio-metrics" data-scroll-reveal data-stagger>{[
      ['Current value', money(summary.value)], ['Total return', `${money(summary.gain)} · ${pct(summary.percent)}`], ['Today’s change', 'Not available'], ['Cash available', money(summary.cash)], ['Holdings', String(holdings.length)],
    ].map(([label, value], index) => <div data-stagger-item key={label}><span>{label}</span><strong className={index === 1 ? (summary.gain >= 0 ? 'fmc-gain' : 'fmc-loss') : ''}>{value}</strong>{index === 0 && <small>$10,000 starting balance</small>}</div>)}</div>
    <PerformanceChart />
    <div className="fmc-section-heading fmc-table-heading"><div><span className="fmc-kicker">Position detail</span><h2>Holdings</h2><p>Click a position to view available research context. Demo positions do not imply actual club trades.</p></div><div className="fmc-table-actions"><label className="fmc-sort-control">Sort by<select value={researchSort} onChange={event => setResearchSort(event.target.value as typeof researchSort)}><option value="company">Company</option><option value="sector">Sector</option><option value="return">Return</option><option value="value">Market value</option></select></label><Button variant="outline" onClick={() => setSheetOpen(true)}>Connect sheet</Button><Button variant="outline" disabled={syncing} onClick={() => connected ? void syncSheet(sheetUrl) : setSheetOpen(true)}>{syncing ? 'Refreshing…' : 'Refresh data'}</Button></div></div>
    <div className="fmc-table-scroll" data-scroll-reveal><table className="fmc-holdings-table"><thead><tr>{['Ticker', 'Company', 'Sector', 'Shares', 'Average cost', 'Current price', 'Market value', 'Weight', 'Return', 'Status'].map(col => <th key={col}>{col}</th>)}</tr></thead><tbody>{sortedHoldings.map(holding => { const value = holding.shares * holding.price; const ret = (holding.price / holding.cost - 1) * 100; return <tr data-stagger-item key={holding.ticker} onClick={() => openHolding(holding)} tabIndex={0} onKeyDown={event => { if (event.key === 'Enter') openHolding(holding); }}><td className="fmc-ticker">{holding.ticker}</td><td>{holding.name}</td><td>{holding.sector}</td><td>{holding.shares}</td><td>{money(holding.cost)}</td><td>{money(holding.price)}</td><td>{money(value)}</td><td>{summary.invested ? `${(value / summary.value * 100).toFixed(1)}%` : '—'}</td><td className={ret >= 0 ? 'fmc-gain' : 'fmc-loss'}>{pct(ret)}</td><td><span className="fmc-status fmc-status-demo">{connected ? 'Sheet' : 'Demo'}</span></td></tr>; })}</tbody></table></div>
    <div className="fmc-allocation-layout" data-scroll-reveal><div><span className="fmc-kicker">Portfolio composition</span><h2>Sector allocation</h2><p>Exposure is calculated from the displayed holdings and cash balance.</p></div><div className="fmc-allocation-list" data-stagger>{summary.sectors.filter(([, value]) => value > 0).map(([name, value]) => <div className="fmc-allocation-row" data-stagger-item key={name}><div><span>{name}</span><strong>{(value / summary.value * 100).toFixed(1)}% <small>{money(value)}</small></strong></div><div className="fmc-allocation-track"><i style={{ width: `${Math.max(0, Math.min(value / summary.value * 100, 100))}%` }}/></div></div>)}</div></div>
  </div>;

  const renderResearch = () => <div className="fmc-shell fmc-page-view"><PageIntro label="Company and market analysis" title="Research" text="Explore research materials from Financial Markets Club. Sample frameworks are labeled; no unpublished analysis is presented as a club recommendation." />
    <div className="fmc-research-tools"><label className="fmc-search"><Search size={17}/><Input value={researchQuery} onChange={event => setResearchQuery(event.target.value)} placeholder="Search companies or reports" aria-label="Search companies or reports"/></label><label><span>Sector</span><select value={researchSector} onChange={event => setResearchSector(event.target.value)}><option>All sectors</option>{[...new Set(content.reports.map(report => report.sector))].map(sector => <option key={sector}>{sector}</option>)}</select></label><label><span>Recommendation</span><select value={researchStatus} onChange={event => setResearchStatus(event.target.value)}><option value="All recommendations">All</option>{['Long', 'Watchlist', 'Short', 'Executed'].map(status => <option key={status}>{status}</option>)}</select></label><span className="fmc-results-count"><Filter size={15}/> {filteredReports.length} reports</span></div>
    <div className="fmc-report-list fmc-research-results" data-scroll-reveal data-stagger>{filteredReports.map(report => <div data-stagger-item key={report.id}><ReportCard report={report} onSelect={openReport}/></div>)}</div>{!filteredReports.length && <div className="fmc-empty"><BookOpen/><strong>No matching research</strong><span>Try changing your filters or search terms.</span></div>}
  </div>;

  const renderSectors = () => <div className="fmc-shell fmc-page-view"><PageIntro label="Industry perspectives" title="Sectors" text="Explore the industries and market themes followed by FMC’s research materials." /><div className="fmc-sector-directory" data-scroll-reveal data-stagger>{sectors.map(sector => {
    const reportCount = content.reports.filter(report => report.sector === sector.name).length;
    return <article data-stagger-item className="fmc-sector-entry" key={sector.name}><h2>{sector.name}</h2><p className="fmc-sector-description">{sector.focus}</p><div className="fmc-sector-insight"><span>Research focus</span><p>{sector.outlook}</p></div><div className="fmc-sector-related"><span>{reportCount} {reportCount === 1 ? 'related report' : 'related reports'}</span><button className="fmc-text-link" onClick={() => { setResearchSector(reportCount ? sector.name : 'All sectors'); go('research'); }}>{reportCount ? 'Browse related research' : 'Browse all research'} <ArrowRight size={15}/></button></div></article>;
  })}</div></div>;

  const renderLeadership = () => <div className="fmc-shell fmc-page-view"><PageIntro label="Club officers and research leads" title="Leadership" text="Officers and team leads coordinate meetings, analysis, and portfolio review."/><p className="fmc-leadership-notice">{content.leadershipNotice}</p><div className="fmc-leadership-grid" data-scroll-reveal data-stagger>{content.leaders.map((leader, index) => <article data-stagger-item key={`${leader.role}-${index}`}>{leader.photo && <img src={leader.photo} alt={leader.name || leader.role}/>}<span className="fmc-leader-role">{leader.role}</span>{leader.name && leader.name !== 'To be announced' && <h2>{leader.name}</h2>}<p>{leader.bio}</p><div className="fmc-leader-contact">{leader.email && <a href={`mailto:${leader.email}`}>{leader.email}</a>}{leader.linkedin && <a href={leader.linkedin} target="_blank" rel="noreferrer">LinkedIn <ArrowRight size={14}/></a>}</div></article>)}</div></div>;

  const renderAbout = () => <div className="fmc-shell fmc-page-view"><PageIntro label="Our purpose" title="Markets are better understood together." text="Financial Markets Club is a student-led organization at Monroe Township High School built around research, discussion, portfolio management, and financial education."/><section className="fmc-about-grid"><article><h2>{content.missionTitle}</h2><p>{content.missionIntro}</p><p>{content.missionBody}</p></article><aside><h2>What members do</h2><ul>{['Learn fundamentals of public markets and company analysis.', 'Work with sector teams to ask better research questions.', 'Present investment ideas and challenge assumptions.', 'Contribute to decisions in an educational simulated portfolio.'].map(item => <li key={item}>{item}</li>)}</ul></aside></section><section className="fmc-member-path"><div><h2>A path through FMC</h2><p>Previous investing experience is not required.</p></div><ol>{['Join FMC', 'Learn fundamentals', 'Join a sector team', 'Research companies', 'Present an idea', 'Discuss portfolio decisions'].map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><span>{step}</span>{index < 5 && <ChevronDown aria-hidden="true"/>}</li>)}</ol></section><section className="fmc-join fmc-about-join"><div><span className="fmc-kicker">Get involved</span><h2>Interested in markets?</h2><p>Contact a club advisor or the school activities office for current meeting details.</p></div></section></div>;

  const currentView = { home: renderHome, portfolio: renderPortfolio, research: renderResearch, sectors: renderSectors, leadership: renderLeadership, about: renderAbout }[view]();

  return <div className="fmc-site"><header className="fmc-header"><div className="fmc-shell fmc-header-inner"><button className="fmc-home-link" onClick={() => go('home')} aria-label="Financial Markets Club home"><Brand/></button><button className="fmc-mobile-toggle" onClick={() => setMobileOpen(open => !open)} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen}>{mobileOpen ? <X/> : <Menu/>}</button><nav ref={navRef} className="fmc-nav" aria-label="Main navigation">{nav.map(([id, label]) => <button key={id} data-nav-id={id} className={view === id ? 'fmc-nav-active' : ''} onClick={() => go(id)}>{label}</button>)}<span className="fmc-nav-indicator" aria-hidden="true"/><Button onClick={() => document.getElementById('join') ? document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' }) : go('about')}>Join FMC</Button></nav></div></header>
    <div className={`fmc-mobile-menu${mobileOpen ? ' is-open' : ''}`} inert={!mobileOpen}><nav aria-label="Mobile navigation">{nav.map(([id, label]) => <button key={id} onClick={() => go(id)}>{label}</button>)}<button className="fmc-mobile-join" onClick={() => { if (view === 'home') { setMobileOpen(false); document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' }); } else go('about'); }}>Join FMC <ArrowRight size={16}/></button></nav><p>Monroe Township High School</p></div>
    <main className="fmc-main"><div ref={contentRef} key={view} className="fmc-main-content">{currentView}</div></main>
    <footer className="fmc-footer"><div className="fmc-shell"><div className="fmc-footer-top"><div><button className="fmc-home-link" onClick={() => go('home')}><Brand/></button><p>Monroe Township High School · Monroe Township, New Jersey</p></div><nav aria-label="Footer navigation">{nav.filter(([id]) => id !== 'home').map(([id, label]) => <button key={id} onClick={() => go(id)}>{label}</button>)}</nav></div><div className="fmc-footer-bottom"><span>© {new Date().getFullYear()} Financial Markets Club</span><span>The club portfolio is simulated for educational purposes. Nothing here constitutes financial advice.</span><a href="/admin">Edit website</a></div></div></footer>
    <Dialog open={sheetOpen} onOpenChange={open => { setSheetOpen(open); if (!open) setSheetError(''); }}><DialogContent className="fmc-dialog"><DialogHeader><DialogTitle>Connect a published holdings sheet</DialogTitle><DialogDescription>Preview a public Google Sheets CSV in this browser. Prices may be delayed; only publish information intended for public viewing.</DialogDescription></DialogHeader><label className="fmc-dialog-field">Published CSV URL<Input value={sheetUrl} onChange={event => setSheetUrl(event.target.value)} placeholder="https://docs.google.com/spreadsheets/d/e/…/pub?output=csv"/></label><p className="fmc-sheet-help">Required columns: Ticker, Company Name, Sector, Shares, Cost Basis, Current Price. Starting balance: $10,000.</p>{sheetError && <p className="fmc-form-error" role="alert">{sheetError}</p>}<div className="fmc-dialog-actions"><Button onClick={() => void connectSheet()} disabled={syncing}>{syncing ? 'Connecting…' : 'Connect sheet'}</Button><Button variant="outline" onClick={() => { setHoldings(DEMO); setCash(undefined); setConnected(false); setSheetUrl(''); localStorage.removeItem('mths-sheet-url'); setSheetOpen(false); }}>Use demo data</Button></div></DialogContent></Dialog>
    <Dialog open={!!selectedReport} onOpenChange={open => { if (!open) closeReport(); }}><DialogContent className="fmc-dialog fmc-report-dialog"><DialogHeader><span className="fmc-kicker">{selectedReport?.sample ? 'Sample learning material' : 'Club research'}</span><DialogTitle>{selectedReport?.title}</DialogTitle><DialogDescription>{selectedReport?.description}</DialogDescription></DialogHeader><div className="fmc-report-detail-meta"><span>{selectedReport?.ticker}</span><span>{selectedReport?.sector}</span><span>{selectedReport?.status}</span></div>{selectedReport?.sample && <p className="fmc-sample-disclaimer">Educational framework prepared for this website. Not a published club report or security recommendation.</p>}<div className="fmc-report-sections">{selectedReport?.sections.map(([heading, text]) => <section key={heading}><h3>{heading}</h3><p>{text}</p></section>)}</div>{selectedReport?.pdfUrl && <Button asChild variant="outline"><a href={selectedReport.pdfUrl} download><FileText/> Download material</a></Button>}</DialogContent></Dialog>
    <Dialog open={!!selectedHolding} onOpenChange={open => { if (!open) closeHolding(); }}><DialogContent className="fmc-dialog"><DialogHeader><span className="fmc-kicker">{selectedHolding?.sector}</span><DialogTitle>{selectedHolding?.name} <span className="fmc-ticker">{selectedHolding?.ticker}</span></DialogTitle><DialogDescription>Illustrative position detail · Demo values are not actual club holdings.</DialogDescription></DialogHeader>{selectedHolding && <div className="fmc-position-detail"><div><span>Current price</span><strong>{money(selectedHolding.price)}</strong></div><div><span>Average cost</span><strong>{money(selectedHolding.cost)}</strong></div><div><span>Return</span><strong className={selectedHolding.price >= selectedHolding.cost ? 'fmc-gain' : 'fmc-loss'}>{pct((selectedHolding.price / selectedHolding.cost - 1) * 100)}</strong></div></div>}<p className="fmc-sheet-help">No verified investment thesis or associated company report has been published for this demo position.</p><Button variant="outline" onClick={() => { closeHolding(); go('research'); }}>Browse research <ArrowRight/></Button></DialogContent></Dialog>
  </div>;
}
