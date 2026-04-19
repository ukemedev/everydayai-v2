"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import "./landing.css"

const API_DOCS_URL = "https://everydayai-backend-production.up.railway.app/docs"

export default function LandingPage() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const saved = (localStorage.getItem("eai-theme") as "dark" | "light") || "dark"
    setTheme(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem("eai-theme", theme)
  }, [theme])

  useEffect(() => {
    const cursor = cursorRef.current
    const ring = ringRef.current
    if (!cursor || !ring) return

    let mx = 0, my = 0, rx = 0, ry = 0
    let rafId: number

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      cursor.style.left = mx - 4 + "px"
      cursor.style.top = my - 4 + "px"
    }

    const animRing = () => {
      rx += (mx - rx) * 0.15
      ry += (my - ry) * 0.15
      ring.style.left = rx - 16 + "px"
      ring.style.top = ry - 16 + "px"
      rafId = requestAnimationFrame(animRing)
    }
    animRing()

    const onEnter = () => {
      cursor.style.transform = "scale(2)"
      ring.style.transform = "scale(1.5)"
      ring.style.borderColor = "rgba(255,85,0,0.8)"
    }
    const onLeave = () => {
      cursor.style.transform = "scale(1)"
      ring.style.transform = "scale(1)"
      ring.style.borderColor = "rgba(255,85,0,0.4)"
    }

    document.addEventListener("mousemove", onMove)
    const interactables = document.querySelectorAll("a, button")
    interactables.forEach(el => {
      el.addEventListener("mouseenter", onEnter)
      el.addEventListener("mouseleave", onLeave)
    })

    return () => {
      document.removeEventListener("mousemove", onMove)
      interactables.forEach(el => {
        el.removeEventListener("mouseenter", onEnter)
        el.removeEventListener("mouseleave", onLeave)
      })
      cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible")
          }
        })
      },
      { threshold: 0.1 }
    )
    const els = document.querySelectorAll(".stepCard, .featureCard, .priceCard")
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="landing" data-theme={theme} style={{ cursor: "none" }}>
      <div className="cursor" ref={cursorRef} />
      <div className="cursorRing" ref={ringRef} />
      <div className="scanlines" />
      <div className="gridBg" />

      <div className="wrap">

        {/* NAV */}
        <nav className="nav">
          <button
            className="navLogo"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{ background: "none", border: "none" }}
          >
            <span className="navBracket">[</span>
            <span className="navName">EverydayAI</span>
            <span className="navBracket">]</span>
            <span className="navTag">// v1.0.0-beta</span>
          </button>
          <div className="navLinks">
            <button className="navLink" onClick={() => scrollTo("how")} style={{ background: "none", border: "none" }}>
              // how it works
            </button>
            <button className="navLink" onClick={() => scrollTo("features")} style={{ background: "none", border: "none" }}>
              // features
            </button>
            <button className="navLink" onClick={() => scrollTo("pricing")} style={{ background: "none", border: "none" }}>
              // pricing
            </button>
            <a href={API_DOCS_URL} target="_blank" rel="noreferrer" className="navLink">
              // api docs
            </a>
          </div>
          <div className="navRight">
            <button
              className="themeToggle"
              onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <Link href="/sign-in" className="navCta">&gt; get started free</Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="hero section">
          <div className="heroBadge">
            <span className="heroBadgeDot" />
            Now in beta — free to get started
          </div>
          <h1 className="heroTitle">
            Deploy <span className="or">AI Agents</span><br />
            to <span className="dim">Any</span> Website.<br />
            In Minutes.
          </h1>
          <p className="heroSub">
            EverydayAI lets agency owners build AI-powered chatbots,
            train them on client documents, and deploy them to any website
            with a single line of code. No technical knowledge required.
          </p>
          <div className="heroActions">
            <Link href="/sign-in" className="btnPrimary">&gt; start building free →</Link>
            <button
              className="btnGhost"
              onClick={() => scrollTo("how")}
              style={{ background: "transparent" }}
            >
              // see how it works
            </button>
          </div>
          <div className="heroStats">
            <div>
              <div className="heroStatVal or">1</div>
              <div className="heroStatLabel">// line of code to deploy</div>
            </div>
            <div>
              <div className="heroStatVal">24/7</div>
              <div className="heroStatLabel">// agent availability</div>
            </div>
            <div>
              <div className="heroStatVal or">∞</div>
              <div className="heroStatLabel">// conversations handled</div>
            </div>
            <div>
              <div className="heroStatVal">0</div>
              <div className="heroStatLabel">// coding required</div>
            </div>
          </div>
          <div className="heroTerminal">
            <div className="terminalBar">
              <div className="tDot" style={{ background: "#ff5f57" }} />
              <div className="tDot" style={{ background: "#ffbd2e" }} />
              <div className="tDot" style={{ background: "#28ca42" }} />
              <span className="terminalTitle">everydayai — deploy.exe</span>
            </div>
            <div className="terminalBody">
              <div className="tLine">
                <span className="tPrompt">$</span>
                <span className="tCmd">everydayai create-agent --name &quot;SmithSolar Assistant&quot;</span>
              </div>
              <div className="tLine tOutput">✓ OpenAI Assistant created — asst_abc123xyz</div>
              <div className="tLine tOutput">✓ Vector store initialized — vs_def456</div>
              <div className="tLine" style={{ marginTop: 8 }}>
                <span className="tPrompt">$</span>
                <span className="tCmd">everydayai upload --file solar-faq.pdf</span>
              </div>
              <div className="tLine tOutput">✓ File indexed in knowledge base — 47 chunks</div>
              <div className="tLine" style={{ marginTop: 8 }}>
                <span className="tPrompt">$</span>
                <span className="tCmd">everydayai publish --agent SmithSolar</span>
              </div>
              <div className="tLine tOutput">✓ Agent live — token: agf_live_a3f9bc12</div>
              <div className="tLine tOutput">✓ Embed script ready for deployment</div>
              <div className="tLine" style={{ marginTop: 8 }}>
                <span className="tPrompt">$</span>
                <span className="tCmd"><span className="tCursor" /></span>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="how section" id="how">
          <div className="howInner">
            <div className="sectionLabel">how it works</div>
            <h2 className="sectionTitle">From zero to live agent<br />in under 10 minutes.</h2>
            <p className="sectionSub">No complex setup. No developer required. Just create, train, and deploy.</p>
            <div className="howSteps">
              {[
                { num: "// step_01", icon: "⚡", title: "Create your agent", desc: "Give your agent a name, write its personality and instructions. Choose GPT-4o Mini for speed or GPT-4o for maximum intelligence." },
                { num: "// step_02", icon: "📚", title: "Upload knowledge", desc: "Upload your client's PDFs, FAQs, product docs, and pricing sheets. Your agent reads and remembers everything for accurate answers." },
                { num: "// step_03", icon: "💬", title: "Test in studio", desc: "Chat with your agent in the built-in studio before going live. Tweak the instructions until it responds exactly how you want." },
                { num: "// step_04", icon: "🚀", title: "Deploy anywhere", desc: "Publish your agent and copy one script tag. Paste it on any website — WordPress, Webflow, Wix, or raw HTML. Done." },
              ].map(step => (
                <div className="stepCard" key={step.num}>
                  <div className="stepNum">{step.num}</div>
                  <div className="stepIcon">{step.icon}</div>
                  <div className="stepTitle">{step.title}</div>
                  <div className="stepDesc">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="section" id="features">
          <div className="featuresInner">
            <div className="sectionLabel">features</div>
            <h2 className="sectionTitle">Everything you need.<br />Nothing you don&apos;t.</h2>
            <p className="sectionSub">Built specifically for AI agency owners who need to move fast and deliver results for clients.</p>
            <div className="featuresGrid">
              {[
                { icon: "🧠", title: "OpenAI Powered", desc: "Agents run on GPT-4o and GPT-4o Mini via your own OpenAI API key. You pay OpenAI directly — no markup, no middleman." },
                { icon: "📄", title: "Knowledge Base", desc: "Upload unlimited PDFs, TXT, and DOCX files. Files are indexed in OpenAI's vector store for fast semantic retrieval." },
                { icon: "🔌", title: "One Line Embed", desc: "A single script tag deploys a beautiful chat widget to any website. No iframe hacks. No CORS issues. Just works." },
                { icon: "🎨", title: "Terminal Aesthetic", desc: "The widget matches your brand — pure black and orange terminal design that looks sharp on any client website." },
                { icon: "💾", title: "Conversation Memory", desc: "Each visitor's conversation is remembered via thread IDs. Returning visitors pick up right where they left off." },
                { icon: "⚡", title: "Instant Deployment", desc: "From creating an agent to deploying it on a client site takes under 10 minutes. Ship same-day for every client." },
              ].map(f => (
                <div className="featureCard" key={f.title}>
                  <div className="featureIcon">{f.icon}</div>
                  <div className="featureTitle">{f.title}</div>
                  <div className="featureDesc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DEPLOY / DEMO */}
        <section className="demo section">
          <div className="demoInner">
            <div>
              <div className="sectionLabel">deploy</div>
              <h2 className="sectionTitle">One script tag.<br />That&apos;s all.</h2>
              <p className="sectionSub" style={{ marginBottom: 32 }}>
                Copy this to your client&apos;s website and the chat widget appears instantly.
                Works on every platform that supports custom HTML.
              </p>
              <div className="demoCode">
                <span className="codeComment">// paste before &lt;/body&gt; on client website</span>
                <br /><br />
                <span className="codeTag">&lt;script</span><br />
                &nbsp;&nbsp;<span className="codeAttr">src</span>=<span className="codeVal">&quot;https://everydayai-backend-production.up.railway.app/widget.js&quot;</span><br />
                &nbsp;&nbsp;<span className="codeAttr">data-token</span>=<span className="codeVal">&quot;agf_live_your_token_here&quot;</span><span className="codeTag">&gt;</span><br />
                <span className="codeTag">&lt;/script&gt;</span>
              </div>
            </div>
            <div>
              <div className="demoChat">
                <div className="chatBar">
                  <div className="chatBarDot" />
                  <span className="chatBarTitle">// SmithSolar Assistant — live</span>
                </div>
                <div className="chatMsgs">
                  <div className="chatMsg bot">
                    <div className="chatLbl">[bot]</div>
                    <div className="chatBubble">Hi! I&apos;m the SmithSolar AI assistant. How can I help you today?</div>
                  </div>
                  <div className="chatMsg user">
                    <div className="chatLbl">[usr]</div>
                    <div className="chatBubble">How much does solar installation cost?</div>
                  </div>
                  <div className="chatMsg bot">
                    <div className="chatLbl">[bot]</div>
                    <div className="chatBubble">Solar installation typically costs between $15,000–$30,000 for a residential home. We offer flexible financing with 0% APR for qualified customers. Would you like a free quote?</div>
                  </div>
                  <div className="chatMsg user">
                    <div className="chatLbl">[usr]</div>
                    <div className="chatBubble">Yes please!</div>
                  </div>
                  <div className="chatMsg bot">
                    <div className="chatLbl">[bot]</div>
                    <div className="chatBubble">Great! I&apos;ll need your address and average monthly electricity bill. Can you share those?</div>
                  </div>
                </div>
                <div className="chatInputArea">
                  <span className="chatPromptS">&gt;_</span>
                  <input className="chatInp" placeholder="type message..." readOnly />
                  <button className="chatSendBtn">↑</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="section" id="pricing">
          <div className="pricingInner">
            <div className="sectionLabel" style={{ justifyContent: "center" }}>pricing</div>
            <h2 className="sectionTitle">Simple pricing.<br />No surprises.</h2>
            <p className="sectionSub" style={{ margin: "0 auto" }}>Start free. Scale as you grow. Cancel anytime.</p>
            <div className="pricingGrid">

              <div className="priceCard">
                <div className="priceTier">// free</div>
                <div className="priceAmount">$0</div>
                <div className="pricePeriod">forever</div>
                <div className="priceDivider" />
                <ul className="priceFeatures">
                  <li>1 agent</li>
                  <li>100 messages/mo</li>
                  <li className="featSep">deployment</li>
                  <li>Widget deployment</li>
                  <li>Knowledge base upload</li>
                  <li>Studio chat testing</li>
                  <li>EverydayAI badge (shows)</li>
                </ul>
                <Link href="/sign-in" className="priceBtn priceBtnGhost">&gt; Ready</Link>
              </div>

              <div className="priceCard">
                <div className="priceTier">// starter</div>
                <div className="priceAmount">$9</div>
                <div className="pricePeriod">/month</div>
                <div className="priceDivider" />
                <ul className="priceFeatures">
                  <li>5 agents</li>
                  <li>Unlimited messages</li>
                  <li className="featSep">deployment</li>
                  <li>Widget deployment</li>
                  <li>Knowledge base upload</li>
                  <li>Studio chat testing</li>
                  <li>Badge removed</li>
                </ul>
                <Link href="/sign-in" className="priceBtn priceBtnGhost">&gt; get Starter</Link>
              </div>

              <div className="priceCard featured">
                <div className="priceTier">// pro</div>
                <div className="priceAmount">$22</div>
                <div className="pricePeriod">/month</div>
                <div className="priceDivider" />
                <ul className="priceFeatures">
                  <li>12 agents</li>
                  <li>Unlimited messages</li>
                  <li className="featSep">deployment</li>
                  <li>Widget deployment</li>
                  <li>Knowledge base upload</li>
                  <li>Studio chat testing</li>
                  <li>Badge removed</li>
                  <li className="featSep">social channels</li>
                  <li>WhatsApp deployment</li>
                  <li>Instagram DMs</li>
                  <li>Facebook Messenger</li>
                  <li className="featSep">tools</li>
                  <li>Lead capture</li>
                </ul>
                <Link href="/sign-in" className="priceBtn priceBtnPrimary">&gt; get Pro</Link>
              </div>

              <div className="priceCard">
                <div className="priceTier">// agency</div>
                <div className="priceAmount">$75</div>
                <div className="pricePeriod">/month</div>
                <div className="priceDivider" />
                <ul className="priceFeatures">
                  <li>Unlimited agents</li>
                  <li>Unlimited messages</li>
                  <li className="featSep">deployment</li>
                  <li>Widget deployment</li>
                  <li>Knowledge base upload</li>
                  <li>Studio chat testing</li>
                  <li>Badge removed</li>
                  <li className="featSep">social channels</li>
                  <li>WhatsApp + IG + Messenger</li>
                  <li>Future channels (early access)</li>
                  <li className="featSep">tools</li>
                  <li>Lead capture</li>
                  <li>AI Voice calls</li>
                  <li>Human escalation</li>
                  <li>Appointment booking</li>
                  <li>Client sub-accounts</li>
                </ul>
                <Link href="/sign-in" className="priceBtn priceBtnGhost">&gt; get Agency</Link>
              </div>

            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta section">
          <div className="ctaInner">
            <div className="sectionLabel" style={{ justifyContent: "center" }}>get started</div>
            <h2 className="ctaTitle">
              Your first agent is<br /><span className="or">10 minutes away.</span>
            </h2>
            <p className="ctaSub">
              Join agency owners already using EverydayAI to deploy AI agents for their clients.
              Free to start. No credit card required.
            </p>
            <Link href="/sign-in" className="btnPrimary" style={{ fontSize: 14, padding: "16px 40px" }}>
              &gt; create your free account →
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div>
            <button
              className="navLogo"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              style={{ background: "none", border: "none" }}
            >
              <span className="navBracket">[</span>
              <span className="navName" style={{ fontSize: 14 }}>EverydayAI</span>
              <span className="navBracket">]</span>
            </button>
            <div className="footerLeft" style={{ marginTop: 6 }}>// Built from Uyo, Nigeria 🇳🇬</div>
          </div>
          <div className="footerLinks">
            <a href={API_DOCS_URL} target="_blank" rel="noreferrer" className="footerLink">// api docs</a>
            <a href="https://github.com/ukemedev" target="_blank" rel="noreferrer" className="footerLink">// github</a>
            <a href="https://ukemedev.hashnode.dev" target="_blank" rel="noreferrer" className="footerLink">// blog</a>
            <a href="https://twitter.com/ukemedev" target="_blank" rel="noreferrer" className="footerLink">// twitter</a>
          </div>
          <div className="footerLeft">© 2026 EverydayAI. All rights reserved.</div>
        </footer>

      </div>
    </div>
  )
}
