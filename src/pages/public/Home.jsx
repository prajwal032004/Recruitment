import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  TrendingUp, Target, Briefcase, Users, KanbanSquare,
  Activity, ShieldCheck, MessageSquareText, Layers, FileText,
  ChevronRight, ArrowRight, UserCheck, BarChart3, Database,
  Settings, Award, Sparkles, Building2, UserCog, UserCheck2, Zap, Globe
} from 'lucide-react'

export default function Home() {
  const { user } = useAuth()

  const getDashboardLink = (u) => {
    if (!u) return '/login'
    if (u.role === 'PLACEMENT_OFFICER' && u.college_slug) return `/${u.college_slug}`
    if (u.role === 'CANDIDATE') return '/app/my-applications'
    if (u.role === 'INTERVIEWER') return '/app/my-interviews'
    if (u.role === 'HR') return '/app/pipeline'
    return '/app/dashboard'
  }

  const dashLink = getDashboardLink(user)

  return (
    <div style={{ background: 'var(--background)', color: 'var(--text)', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Scoped responsive styles */}
      <style>{`
        .home-hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 56px;
          align-items: center;
        }
        .home-hero-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .home-hero-h1 {
          font-size: 44px;
          font-weight: 900;
          line-height: 1.12;
          letter-spacing: -0.5px;
          margin-bottom: 20px;
        }
        .home-hero-desc {
          font-size: 16px;
          line-height: 1.7;
          margin-bottom: 32px;
        }
        .home-hero-btns {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        .home-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        .home-steps-row {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          align-items: stretch;
        }
        .home-roles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        .home-stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
        }
        .home-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .home-hero-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .home-steps-row {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .home-hero-h1 {
            font-size: 30px;
          }
          .home-hero-desc {
            font-size: 14px;
          }
          .home-hero-stats {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .home-features-grid {
            grid-template-columns: 1fr;
          }
          .home-steps-row {
            grid-template-columns: 1fr 1fr;
          }
          .home-roles-grid {
            grid-template-columns: 1fr;
          }
          .home-stats-row {
            grid-template-columns: 1fr 1fr;
          }
          .home-step-arrow {
            display: none;
          }
        }
        @media (max-width: 480px) {
          .home-hero-stats {
            grid-template-columns: 1fr;
          }
          .home-stats-row {
            grid-template-columns: 1fr;
          }
          .home-steps-row {
            grid-template-columns: 1fr;
          }
          .home-hero-btns {
            flex-direction: column;
          }
          .home-hero-btns a {
            text-align: center;
          }
        }
      `}</style>

      {/* ─── Nav Bar ─── */}
      <nav className="public-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="mpc-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img src="https://smartdesk.mpcholdinggroup.com/static/media/MPC_Logos.a18c8f830b6cadd171cd.jpg" alt="MPC Logo" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} />
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link to="/careers" className="btn-ghost" style={{ fontSize: 14, fontWeight: 600, textDecoration: 'none', padding: '8px 16px' }}>Browse Jobs</Link>
          {user ? (
            <Link to={dashLink} className="btn-primary" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: 8 }}>Go to Dashboard</Link>
          ) : (
            <Link to="/login" className="btn-soft" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: 8 }}>Sign in</Link>
          )}
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <div className="public-wrap" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div className="home-hero-grid">
          <div>
            <div className="chip" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-100)', marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700 }}>
              <Sparkles size={14} /> Campus & Lateral Hiring Intelligence
            </div>
            <h1 className="home-hero-h1" style={{ color: 'var(--text)' }}>
              Unified recruitment & campus hiring intelligence platform.
            </h1>
            <p className="muted home-hero-desc">
              Publish jobs, assign to partner colleges, or post to a careers portal.
              Every application enters a deduplicated pipeline with automated resume parsing,
              eligibility screening, and explainable match scoring — all the way from application to onboarding.
            </p>
            <div className="home-hero-btns">
              <Link to="/careers" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 28px', fontSize: 15, fontWeight: 700, borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Explore Open Roles <ArrowRight size={16} />
              </Link>
              {user ? (
                <Link to={dashLink} className="btn-soft" style={{ textDecoration: 'none', padding: '12px 28px', fontSize: 15, fontWeight: 700, borderRadius: 10 }}>
                  Go to Dashboard
                </Link>
              ) : (
                <Link to="/login" className="btn-soft" style={{ textDecoration: 'none', padding: '12px 28px', fontSize: 15, fontWeight: 700, borderRadius: 10 }}>
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Right-side: Clean stats visual */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="home-hero-stats">
              {[
                { icon: KanbanSquare, value: '10 Stages', label: 'Pipeline Workflow', color: '#4f46e5' },
                { icon: Layers, value: 'AI Matching', label: 'Skill-Based Scoring', color: '#0891b2' },
                { icon: Building2, value: 'Multi-College', label: 'Campus Integration', color: '#7c3aed' },
                { icon: ShieldCheck, value: 'Role-Based', label: 'Access Control', color: '#059669' },
              ].map((item, i) => (
                <div key={i} style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '22px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  transition: 'all 0.25s ease',
                  cursor: 'default',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `${item.color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <item.icon size={18} style={{ color: item.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>{item.value}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginTop: 2 }}>{item.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtle process strip */}
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)',
              borderRadius: 14,
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              color: '#fff',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap size={20} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>End-to-End Automation</div>
                <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.4, marginTop: 2 }}>
                  From JD creation to candidate onboarding — fully tracked with audit trails.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Features & Capabilities ─── */}
      <div style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', padding: '80px 24px' }}>
        <div className="public-wrap" style={{ padding: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>Features & Capabilities</h2>
            <p className="muted" style={{ fontSize: 15 }}>A unified suite designed for transparent placement and precise lateral hiring.</p>
          </div>
          
          <div className="home-features-grid">
            {[
              { icon: Briefcase, title: "Job & JD Management", desc: "Draft role specifications and publish them to public careers page or assign them to partner college drives." },
              { icon: Building2, title: "College Placement Portal", desc: "Assigned JDs route to dedicated college dashboards where placement officers manage and submit students." },
              { icon: UserCog, title: "Student Roster Management", desc: "Placement officers can add students manually or bulk-import via CSV/Excel sheets with validation." },
              { icon: Users, title: "Public Careers Portal", desc: "Direct candidate portal allowing external job seekers to explore open roles, upload resumes, and self-apply." },
              { icon: Database, title: "Deduplicated Profiles", desc: "Unique master profiles normalize email/phone records to track candidate histories across multiple roles." },
              { icon: Layers, title: "Automated Match Engine", desc: "Parses resumes, runs eligibility screening, and calculates explainable match scores based on requirements." },
              { icon: KanbanSquare, title: "Kanban Recruitment Pipeline", desc: "Track pipeline flow in real time across 10 stages with comprehensive transition audit histories." },
              { icon: UserCheck, title: "Interviewer Pass/Fail Gating", desc: "Structured gating where interviewers verify candidate fit and record pass/fail verdicts on technical rounds." },
              { icon: Activity, title: "Structured Scorecards", desc: "Record detailed interview feedback, ratings, and recommendations inside a single candidate dossier." },
              { icon: BarChart3, title: "Recruitment Analytics", desc: "Insights into conversion rates, funnel leaks, source effectiveness, and college performance scorecards." },
              { icon: TrendingUp, title: "Workforce Planning", desc: "Forecasting hiring trends, demand-vs-supply skill gap analyses, and capacity calculators." },
              { icon: MessageSquareText, title: "HR Policy Assistant", desc: "Interact with uploaded HR policy documents using an offline Q&A search with source citations." },
              { icon: UserCheck2, title: "Joined Candidate Roster", desc: "Manage successful hires in a unified roster with candidate profile viewing and CSV export." },
              { icon: ShieldCheck, title: "Security & Operations", desc: "Data-quality checks, system audit log tracking actions, and instant in-app notifications." }
            ].map((f, i) => (
              <div key={i} className="card" style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '24px 22px',
                transition: 'all 0.25s ease',
                cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = 'var(--brand-200)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: 'var(--brand-50)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <f.icon size={20} style={{ color: 'var(--brand-600)' }} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p className="muted" style={{ fontSize: 13, lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── How It Works ─── */}
      <div className="public-wrap" style={{ padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>How It Works</h2>
          <p className="muted" style={{ fontSize: 15 }}>The end-to-end recruitment process in six clear steps.</p>
        </div>

        <div className="home-steps-row">
          {[
            { step: "1", label: "Create JD", desc: "Define job roles & requirements", icon: FileText },
            { step: "2", label: "Publish / Assign", desc: "Post to careers or colleges", icon: Globe },
            { step: "3", label: "Collect Apps", desc: "Students submit & candidates apply", icon: Users },
            { step: "4", label: "Match & Screen", desc: "Automated scoring & eligibility", icon: Target },
            { step: "5", label: "Pipeline & Gate", desc: "Interviews & stage gating", icon: KanbanSquare },
            { step: "6", label: "Join & Analyze", desc: "Onboard hires & analyze data", icon: Award },
          ].map((s, idx) => (
            <div key={idx} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '24px 16px',
              textAlign: 'center',
              transition: 'all 0.25s ease',
              position: 'relative',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--brand-gradient)',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800,
                margin: '0 auto 14px auto'
              }}>{s.step}</div>
              <s.icon size={22} style={{ color: 'var(--brand-500)', marginBottom: 10 }} />
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
              <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.45 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Platform Roles ─── */}
      <div style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', padding: '80px 24px' }}>
        <div className="public-wrap" style={{ padding: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>Platform Roles</h2>
            <p className="muted" style={{ fontSize: 15 }}>A role-based access system matching organizational hierarchy.</p>
          </div>

          <div className="home-roles-grid">
            {[
              { role: "Admin", icon: Settings, desc: "Oversees system settings, manages college partnerships, JDs, and audit logs.", color: '#4f46e5' },
              { role: "HR Manager", icon: Users, desc: "Manages job postings, candidates, pipeline stages, scorecards, and planning.", color: '#0891b2' },
              { role: "Interviewer", icon: UserCheck, desc: "Gives pass/fail verdicts on technical rounds and logs structured scorecards.", color: '#d97706' },
              { role: "Placement Officer", icon: Building2, desc: "Submits qualified students and tracks their status in the college portal.", color: '#7c3aed' },
              { role: "Candidate", icon: UserCog, desc: "Applies to jobs, uploads resumes, and views their active application status.", color: '#059669' }
            ].map((r, i) => (
              <div key={i} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '28px 22px',
                textAlign: 'center',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${r.color}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 14px auto',
                }}>
                  <r.icon size={22} style={{ color: r.color }} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{r.role}</h3>
                <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.55, margin: 0 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── By The Numbers ─── */}
      <div className="public-wrap" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>MPC By The Numbers</h2>
        </div>
        <div className="home-stats-row">
          {[
            { value: "5 Roles", label: "Granular access permissions" },
            { value: "1 Pipeline", label: "Unified candidate tracking" },
            { value: "10 Stages", label: "From applied to joined" },
            { value: "100%", label: "Deduplicated profiles" }
          ].map((s, i) => (
            <div key={i} style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-light)',
              borderRadius: 14,
              padding: '28px 20px',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--brand-600)', marginBottom: 6 }}>{s.value}</div>
              <span className="muted" style={{ fontSize: 12.5 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '40px 24px' }}>
        <div className="public-wrap" style={{ padding: 0 }}>
          <div className="home-footer-row" style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
            <div>
              <strong style={{ fontSize: 16 }}>MPC Cloud Consulting</strong>
              <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>Modern hiring infrastructure with automated intelligence.</p>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <Link to="/careers" className="muted" style={{ fontSize: 13, textDecoration: 'none' }}>Browse Jobs</Link>
              <Link to="/login" className="muted" style={{ fontSize: 13, textDecoration: 'none' }}>Sign In</Link>
            </div>
          </div>
          <div className="home-footer-row" style={{ marginTop: 24 }}>
            <span className="muted" style={{ fontSize: 12 }}>
              Built with: React + Vite, Flask + SQLAlchemy, JWT auth, scikit-learn matching/forecasting, offline TF-IDF policy assistant.
            </span>
            <span className="muted" style={{ fontSize: 12 }}>
              &copy; {new Date().getFullYear()} MPC Cloud Consulting. All rights reserved.
            </span>
          </div>
        </div>
      </footer>

    </div>
  )
}
