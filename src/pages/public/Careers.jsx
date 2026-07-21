import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetch } from '../../components/hooks'
import { LoadingSpinner, ErrorState } from '../../components/UI'
import PublicHeader from '../../components/PublicHeader'
import PublicFooter from '../../components/PublicFooter'

export default function Careers() {
  const { data, loading, error, refetch } = useFetch('/careers/jds')
  const nav = useNavigate()
  
  const jobs = data?.jobs || []

  return (
    <div className="mpc-page">
      <PublicHeader />

      <div className="mpc-content fade-in">
        
        {/* Hero Section */}
        <section className="mpc-hero">
          <div className="mpc-hero-overlay">
            <h1>JOIN THE<br />REVOLUTION</h1>
            <button className="mpc-hero-btn">DISCOVER MORE</button>
          </div>
        </section>

        {/* Intro Section */}
        <section className="mpc-intro">
          <img src="https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=800&q=80" alt="Career Opportunities" />
          <div className="mpc-intro-content">
            <h2>CAREER OPPORTUNITIES</h2>
            <p>
              It's enriching to work with the leading Oracle Cloud Consulting Organization. 
              We are the hub for the most dynamic and passionate individuals that specialize in Oracle Services.
            </p>
            <p>
              We are working to set up newer standards in the area of Cloud Consulting.
            </p>
            <p>
              Be a part of the exciting world of opportunities that await.
            </p>
          </div>
        </section>

        {/* Job List */}
        <section className="mpc-job-list">
          <h2>OPEN JOBS IN MPC CLOUD CONSULTING</h2>
          
          {loading && <LoadingSpinner />}
          {error && <ErrorState message={error} onRetry={refetch} />}
          
          {!loading && !error && jobs.length === 0 && (
            <p className="muted" style={{ padding: 24, textAlign: 'center' }}>No open positions available currently.</p>
          )}

          {!loading && !error && jobs.map((j) => (
            <div key={j.id} className="mpc-job-row">
              <div className="mpc-job-title">{j.title}</div>
              <div className="mpc-job-exp">{j.experience_min ? `${j.experience_min}+ Years` : 'Fresher / Any'}</div>
              <div className="mpc-job-loc">{j.location || 'Remote'}</div>
              <button className="btn mpc-btn-outline" onClick={() => nav(`/careers/${j.id}`)}>
                APPLY NOW
              </button>
            </div>
          ))}
        </section>

      </div>

      <PublicFooter />
    </div>
  )
}
