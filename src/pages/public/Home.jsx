import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  TrendingUp, Target, Briefcase, Users, KanbanSquare,
  Activity, ShieldCheck, MessageSquareText, Layers, FileText,
  ChevronRight, ArrowRight, UserCheck, BarChart3, Database,
  Settings, Award, Sparkles, Building2, UserCog, UserCheck2
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
      
      {/* ─── Nav Bar ─── */}
      <nav className="public-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="mpc-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img src="https://smartdesk.mpcholdinggroup.com/static/media/MPC_Logos.a18c8f830b6cadd171cd.jpg" alt="MPC Logo" style={{ height: '44px', width: 'auto', objectFit: 'contain' }} />
        </Link>
        <div className="flex" style={{ gap: 16, alignItems: 'center' }}>
          <Link to="/careers" className="btn-ghost" style={{ fontSize: 14, fontWeight: 600, textDecoration: 'none', padding: '8px 16px' }}>Browse Jobs</Link>
          {user ? (
            <Link to={dashLink} className="btn-primary" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: 8 }}>Go to Dashboard</Link>
          ) : (
            <Link to="/login" className="btn-soft" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: 8 }}>Sign in</Link>
          )}
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <div className="public-wrap" style={{ paddingTop: 60, paddingBottom: 60 }}>
        <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div className="chip" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-100)', marginBottom: 16 }}>
              <Sparkles size={14} style={{ marginRight: 6 }} /> Campus & Lateral Hiring
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.15, color: 'var(--text)', marginBottom: 20 }}>
              A recruitment & campus-hiring intelligence platform.
            </h1>
            <p className="muted" style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 30 }}>
              Admin/HR publish jobs, assign them to colleges, or post them to a public careers page where placement officers submit students and external candidates apply. Every application enters a single deduplicated pipeline featuring automated resume parsing, eligibility screening, and explainable skill-match scoring. HR runs the Kanban pipeline, interviewers gate rounds with pass/fail verdicts, and outcomes feed live analytics, workforce planning, and an HR policy assistant.
            </p>
            <div className="flex" style={{ gap: 16 }}>
              <Link to="/careers" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 24px', fontSize: 15, fontWeight: 700, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Explore open roles <ArrowRight size={16} />
              </Link>
              {user ? (
                <Link to={dashLink} className="btn-soft" style={{ textDecoration: 'none', padding: '12px 24px', fontSize: 15, fontWeight: 700, borderRadius: 8 }}>
                  Go to Dashboard
                </Link>
              ) : (
                <Link to="/login" className="btn-soft" style={{ textDecoration: 'none', padding: '12px 24px', fontSize: 15, fontWeight: 700, borderRadius: 8 }}>
                  Sign in
                </Link>
              )}
            </div>
          </div>

          {/* Tasteful Right-side Visual (mock Kanban) */}
          <div className="card" style={{ padding: 20, background: 'var(--surface-2)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 12 }}>
              <strong style={{ fontSize: 14 }}>Recruitment Spine</strong>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-500)' }} />
            </div>
            <div className="stack" style={{ gap: 12 }}>
              <div className="card" style={{ padding: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-600)', marginBottom: 4 }}>SHORTLISTED</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Priya Sharma</div>
                <div className="flex-between" style={{ marginTop: 8, fontSize: 11 }}>
                  <span className="muted">Match Score</span>
                  <strong style={{ color: 'var(--green-600)' }}>94%</strong>
                </div>
              </div>
              <div className="card" style={{ padding: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>INTERVIEW ROUND 1</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Amit Patel</div>
                <div className="flex-between" style={{ marginTop: 8, fontSize: 11 }}>
                  <span className="muted">Verdict</span>
                  <strong className="chip" style={{ padding: '2px 6px', background: '#ecfdf5', color: '#047857', fontSize: 10 }}>Passed</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── What It Does Section ─── */}
      <div style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', padding: '80px 24px' }}>
        <div className="public-wrap">
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>Features & Capabilities</h2>
            <p className="muted" style={{ fontSize: 15 }}>A unified suite designed for transparent placement and precise lateral hiring.</p>
          </div>
          
          <div className="grid-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {[
              {
                icon: Briefcase,
                title: "Job & JD Management",
                desc: "Draft role specifications and publish them to public careers page or assign them to partner college drives."
              },
              {
                icon: Building2,
                title: "College Placement Portal",
                desc: "Assigned JDs route to dedicated college dashboards where placement officers manage and submit students."
              },
              {
                icon: UserCog,
                title: "Student Roster Management",
                desc: "Placement officers can add students manually or bulk-import via CSV/Excel sheets with validation."
              },
              {
                icon: Users,
                title: "Public Careers Portal",
                desc: "Direct candidate portal allowing external job seekers to explore open roles, upload resumes, and self-apply."
              },
              {
                icon: Database,
                title: "Deduplicated Profiles",
                desc: "Unique master profiles normalize email/phone records to track candidate histories across multiple roles."
              },
              {
                icon: Layers,
                title: "Automated Match Engine",
                desc: "Parses resumes, runs eligibility screening, and calculates explainable match scores based on requirements."
              },
              {
                icon: KanbanSquare,
                title: "Kanban Recruitment Pipeline",
                desc: "Track pipeline flow in real time across 10 stages with comprehensive transition audit histories."
              },
              {
                icon: UserCheck,
                title: "Interviewer Pass/Fail Gating",
                desc: "Structured gating where interviewers verify candidate fit and record pass/fail verdicts on technical rounds."
              },
              {
                icon: Activity,
                title: "Structured Scorecards",
                desc: "Record detailed interview feedback, ratings, and recommendations inside a single candidate dossier."
              },
              {
                icon: BarChart3,
                title: "Recruitment Analytics",
                desc: "Insights into conversion rates, funnel leaks, source effectiveness, and college performance scorecards."
              },
              {
                icon: TrendingUp,
                title: "Workforce Planning",
                desc: "Forecasting hiring trends, demand-vs-supply skill gap analyses, and capacity calculators."
              },
              {
                icon: MessageSquareText,
                title: "HR Policy Assistant",
                desc: "Interact with uploaded HR policy documents using an offline Q&A search with source citations."
              },
              {
                icon: UserCheck2,
                title: "Joined Candidate Roster",
                desc: "Manage successful hires in a unified roster with candidate profile viewing and CSV export."
              },
              {
                icon: ShieldCheck,
                title: "Security & Operations",
                desc: "Data-quality checks, system audit log tracking actions, and instant in-app notifications."
              }
            ].map((f, i) => (
              <div key={i} className="card card-pad" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--brand-500)', marginBottom: 12 }}><f.icon size={24} /></div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── How It Works Section ─── */}
      <div className="public-wrap" style={{ padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>How It Works</h2>
          <p className="muted" style={{ fontSize: 15 }}>The end-to-end recruitment process workflow.</p>
        </div>

        <div className="flex" style={{ gap: 16, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { step: "1", label: "Create JD", desc: "Define job roles & requirements" },
            { step: "2", label: "Publish / Assign", desc: "Post to careers or colleges" },
            { step: "3", label: "Collect Applications", desc: "Students submit & candidates apply" },
            { step: "4", label: "Match & Screen", desc: "Automated scoring & eligibility" },
            { step: "5", label: "Kanban & Gate", desc: "Interviews & stage gating" },
            { step: "6", label: "Join & Analyze", desc: "Onboard hires & analyze data" }
          ].map((s, idx) => (
            <div key={idx} className="flex" style={{ alignItems: 'center', gap: 12, flex: '1 1 180px' }}>
              <div className="card card-pad" style={{ flex: 1, textAlign: 'center', padding: '20px 12px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: 'var(--brand-gradient)', 
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: 12, fontWeight: 800, margin: '0 auto 10px auto'
                }}>{s.step}</div>
                <strong style={{ fontSize: 13.5, display: 'block', marginBottom: 4 }}>{s.label}</strong>
                <span className="muted" style={{ fontSize: 11.5, lineHeight: 1.4 }}>{s.desc}</span>
              </div>
              {idx < 5 && <ChevronRight size={20} className="muted" style={{ display: 'block', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Who Uses It Section ─── */}
      <div style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', padding: '80px 24px' }}>
        <div className="public-wrap">
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>Platform Roles</h2>
            <p className="muted" style={{ fontSize: 15 }}>A role-based access system matching organizational hierarchy.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { role: "Admin", icon: Settings, desc: "Oversees system settings, manages college partnerships, JDs, and audit logs." },
              { role: "HR Manager", icon: Users, desc: "Manages job postings, candidates, pipeline stages, scorecards, and planning." },
              { role: "Interviewer", icon: UserCheck, desc: "Gives pass/fail verdicts on technical rounds and logs structured scorecards." },
              { role: "Placement Officer", icon: Building2, desc: "Submits qualified students and tracks their status in the college portal." },
              { role: "Candidate", icon: UserCog, desc: "Applies to jobs, uploads resumes, and views their active application status." }
            ].map((r, i) => (
              <div key={i} className="card card-pad" style={{ background: 'var(--surface)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ color: 'var(--brand-500)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}><r.icon size={24} /></div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{r.role}</h3>
                <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── By The Numbers Section ─── */}
      <div className="public-wrap" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>MPC By The Numbers</h2>
        </div>
        <div className="grid-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
          {[
            { value: "5 Roles", label: "Granular access permissions" },
            { value: "1 Pipeline", label: "Unified candidate tracking" },
            { value: "10 Stages", label: "From applied to joined" },
            { value: "100%", label: "Deduplicated profiles" }
          ].map((s, i) => (
            <div key={i} className="card card-pad" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--brand-600)', marginBottom: 4 }}>{s.value}</div>
              <span className="muted" style={{ fontSize: 12.5 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Tech Footer ─── */}
      <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '40px 24px' }}>
        <div className="public-wrap" style={{ padding: 0 }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
            <div>
              <strong style={{ fontSize: 16 }}>MPC Cloud Consulting</strong>
              <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>Modern hiring infrastructure with automated intelligence.</p>
            </div>
            <div className="flex" style={{ gap: 16 }}>
              <Link to="/careers" className="muted" style={{ fontSize: 13, textDecoration: 'none' }}>Browse Jobs</Link>
              <Link to="/login" className="muted" style={{ fontSize: 13, textDecoration: 'none' }}>Sign In</Link>
            </div>
          </div>
          <div className="flex-between" style={{ marginTop: 24, flexWrap: 'wrap', gap: 12 }}>
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
