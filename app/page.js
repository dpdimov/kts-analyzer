"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import mammoth from "mammoth";

const SYSTEM_PROMPT = `You are an analytical tool for mapping text onto the Kinetic Thinking Styles (KTS) framework developed by Dimov & Pistrui (2023).

The KTS framework has two dimensions:

DIMENSION 1: ATTITUDE TOWARDS UNCERTAINTY (What we do)
This is a continuum from REASON to PLAY.
- REASON pole: The text emphasises rational justification for actions, evidence-based decision making, anticipation and evaluation of consequences, accountability, structured planning, deliberate strategy. Language markers: causal reasoning ("because", "therefore", "in order to"), evidence references ("data shows", "analysis indicates"), risk mitigation, goal-outcome chains, evaluation criteria, due diligence.
- PLAY pole: The text emphasises probing, experimenting, acting to see what happens, tolerance of ambiguity, improvisation, serendipity, trial and error. Language markers: exploratory framing ("let's see", "what if", "we tried"), comfort with not knowing, pivot language, emergence, surprise as positive, action for its own sake, iterative discovery.

DIMENSION 2: ATTITUDE TOWARDS POSSIBILITY (What we see)
This is a continuum from STRUCTURE to OPENNESS.
- STRUCTURE pole: The text operates within established categories and frameworks, evaluates fit and relevance of information against existing schema, focuses on what IS, convergent reasoning, validation against known patterns. Language markers: categorical language, taxonomies, benchmarking, fit assessment, established metrics, industry norms, historical precedent, "best practices".
- OPENNESS pole: The text reframes situations, imagines alternatives, signals discontinuity, sees novel possibilities, focuses on what is NOT YET, divergent reasoning, future-oriented speculation. Language markers: metaphorical/analogical thinking, reframing ("what if we think of this as..."), possibility language, imagination, vision of transformation, disruption, questioning assumptions.

SCORING: Score each dimension from -10 to +10.
- Attitude towards uncertainty: -10 = pure reason, +10 = pure play
- Attitude towards possibility: -10 = pure structure, +10 = pure openness

The four quadrants are:
- FOCUSED (reason + structure): Systematic, evidence-based, operating within known frameworks
- INCREMENTAL (reason + openness): Sees new possibilities but acts deliberately and with justification
- PLAYFUL (play + structure): Experiments within established frameworks, tests boundaries pragmatically  
- BREAKAWAY (play + openness): Experiments freely, reimagines possibilities, embraces radical novelty

Respond ONLY with valid JSON in this exact format, no markdown, no backticks:
{"uncertainty_score": <number -10 to 10>, "possibility_score": <number -10 to 10>, "style": "<Focused|Incremental|Playful|Breakaway>", "uncertainty_reasoning": "<2-3 sentences explaining the uncertainty dimension score with specific textual evidence>", "possibility_reasoning": "<2-3 sentences explaining the possibility dimension score with specific textual evidence>", "key_indicators": ["<phrase or pattern 1>", "<phrase or pattern 2>", "<phrase or pattern 3>", "<phrase or pattern 4>", "<phrase or pattern 5>"], "summary": "<1-2 sentence overall interpretation of the thinking style revealed in this text>"}`;

const SAMPLE_TEXTS = {
  "Personal reflection": `I am an Industrial Engineer – I believe in setting objectives, determining the best way to achieve them, and execute accordingly. I value rational thinking and structure. I gathered tons of information and was in a far better position to judge the viability of the project, but still, a lot of pieces of the puzzle didn't click. For example, there was a problem with finding the right domain experts that can build this type of complex software. And the funding was not guaranteed, so I had to drop it. I naturally tend to make decisions based on concrete data. Be it statistics, marketing, primary or secondary research. I like to have lots of data to use in making a decision.`,
  "Visionary founder pitch": `We're not building another analytics tool. We're reimagining what it means for a business to understand itself. What if your company could feel its own pulse — not through dashboards and KPIs, but through a living, breathing sense of where momentum is building and where energy is fading? We don't know exactly what form this will take yet, and that's the exciting part. We've been experimenting with some wild ideas — ambient data experiences, spatial computing interfaces — and every prototype surprises us. The market doesn't know it needs this yet, but when they see it, everything will shift.`,
  "Operations report": `Q3 operational efficiency improved by 3.2% against our target of 3.0%, driven primarily by the supply chain optimization initiative launched in Q1. Process standardisation across the three manufacturing sites has reduced variance in output quality from 4.1% to 2.8%. We recommend continuing the phased rollout of the new ERP modules, with Stage 3 implementation scheduled for Q4 pending successful completion of user acceptance testing. Risk assessment indicates two areas requiring attention: vendor concentration in the Southeast Asian supply corridor and pending regulatory changes in packaging standards. Mitigation plans are detailed in Appendix C.`,
  "Design thinking workshop": `Today we threw out the brief entirely. Instead of solving the problem as stated, we asked: whose problem is this really? We spent the morning in the field, just watching and listening, letting patterns emerge rather than hunting for them. One conversation with a nightshift nurse completely upended our assumptions — what we thought was a logistics problem turned out to be a trust problem. We prototyped three completely different directions in the afternoon, deliberately making them rough and provocative. The one that got the strongest reaction — both positive and negative — is the one we're pursuing tomorrow. We have no idea if it'll work, but it feels alive.`
};

const styleColors = {
  Focused: { accent: "#ff6f20" },
  Incremental: { accent: "#9f60b5" },
  Playful: { accent: "#bed600" },
  Breakaway: { accent: "#009ddb" },
};

function KTSMatrix({ uncertaintyScore, possibilityScore, style }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      const displayW = 400;
      const displayH = 400;
      canvas.width = displayW * dpr;
      canvas.height = displayH * dpr;
      canvas.style.width = "100%";
      canvas.style.maxWidth = displayW + "px";
      canvas.style.height = "auto";
      ctx.scale(dpr, dpr);

      const w = displayW, h = displayH;

      ctx.clearRect(0, 0, w, h);

      // Draw background image if loaded
      if (imgRef.current) {
        ctx.drawImage(imgRef.current, 0, 0, w, h);
      }

      if (uncertaintyScore !== null && possibilityScore !== null) {
        // Map scores to canvas coordinates
        // The image plot area is inset: labels sit outside the colored borders
        // Matching the 10/12 ratio from the results-view Chart.tsx
        const cx = w / 2, cy = h / 2;
        const plotRange = (w / 2) * (10 / 12); // usable plot radius
        const plotX = cx + (uncertaintyScore / 10) * plotRange;
        const plotY = cy - (possibilityScore / 10) * plotRange;
        const color = styleColors[style] || styleColors.Focused;

        // Glow
        const gradient = ctx.createRadialGradient(plotX, plotY, 0, plotX, plotY, 30);
        gradient.addColorStop(0, color.accent + "80");
        gradient.addColorStop(1, color.accent + "00");
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.arc(plotX, plotY, 30, 0, Math.PI * 2); ctx.fill();

        // Point
        ctx.fillStyle = color.accent;
        ctx.beginPath(); ctx.arc(plotX, plotY, 7, 0, Math.PI * 2); ctx.fill();

        // Ring
        ctx.strokeStyle = color.accent + "80"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(plotX, plotY, 12, 0, Math.PI * 2); ctx.stroke();
      }
    };

    // Load image then draw
    if (!imgRef.current) {
      const img = new Image();
      img.onload = () => { imgRef.current = img; draw(); };
      img.src = "/images/plot-background.png";
    } else {
      draw();
    }
  }, [uncertaintyScore, possibilityScore, style]);

  return <canvas ref={canvasRef} style={{ borderRadius: 8 }} />;
}

function DimensionBar({ label, leftLabel, rightLabel, score, color }) {
  const pct = ((score + 10) / 20) * 100;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#8899bb", fontFamily: "Georgia, serif", fontStyle: "italic" }}>{leftLabel}</span>
        <span style={{ fontSize: 12, color: "#c0ccdd", fontFamily: "Georgia, serif", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 11, color: "#8899bb", fontFamily: "Georgia, serif", fontStyle: "italic" }}>{rightLabel}</span>
      </div>
      <div style={{ height: 6, background: "rgba(100,140,200,0.1)", borderRadius: 3, position: "relative" }}>
        <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: 6, background: "rgba(160,180,220,0.3)" }} />
        <div style={{
          position: "absolute", left: `${pct}%`, top: -3, width: 12, height: 12,
          borderRadius: "50%", background: color, transform: "translateX(-50%)",
          boxShadow: `0 0 12px ${color}40`
        }} />
      </div>
      <div style={{ textAlign: "center", marginTop: 4, fontSize: 13, color, fontFamily: "Georgia, serif", fontWeight: 600 }}>
        {score > 0 ? "+" : ""}{score.toFixed(1)}
      </div>
    </div>
  );
}

function FileUpload({ onTextExtracted }) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const inputRef = useRef(null);

  const processFile = async (file) => {
    setFileError(null);
    setFileName(file.name);
    setExtracting(true);
    const ext = file.name.split(".").pop().toLowerCase();

    try {
      if (ext === "txt" || ext === "md" || ext === "csv") {
        const text = await file.text();
        onTextExtracted(text, file.name, null);
      } else if (ext === "pdf") {
        const base64 = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result.split(",")[1]);
          reader.onerror = () => rej(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
        onTextExtracted(null, file.name, { type: "pdf", base64 });
      } else if (ext === "docx") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        onTextExtracted(result.value, file.name, null);
      } else {
        setFileError(`Unsupported file type: .${ext}. Use PDF, DOCX, or TXT.`);
      }
    } catch (err) {
      setFileError("Could not read file. Please try another format.");
      console.error(err);
    } finally {
      setExtracting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          padding: "24px 16px",
          border: `1.5px dashed ${dragActive ? "rgba(100,180,240,0.5)" : "rgba(100,140,200,0.2)"}`,
          borderRadius: 6,
          background: dragActive ? "rgba(100,180,240,0.05)" : "rgba(15,23,42,0.4)",
          cursor: "pointer", textAlign: "center", transition: "all 0.2s",
        }}
      >
        <input
          ref={inputRef} type="file" accept=".pdf,.docx,.txt,.md"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          style={{ display: "none" }}
        />
        <div style={{ fontSize: 13, color: "#6a7f99", fontFamily: "Georgia, serif" }}>
          {extracting ? (
            <span style={{ color: "#8899bb" }}>Extracting text…</span>
          ) : fileName ? (
            <span style={{ color: "#a0bcdd" }}>📄 {fileName}</span>
          ) : (
            <>
              <span style={{ color: "#8899bb" }}>Drop a file here</span>{" "}or{" "}
              <span style={{ color: "#a0bcdd", textDecoration: "underline" }}>browse</span>
              <div style={{ fontSize: 11, color: "#4a5f7f", marginTop: 6 }}>PDF · DOCX · TXT</div>
            </>
          )}
        </div>
      </div>
      {fileError && <div style={{ marginTop: 8, fontSize: 12, color: "#e08080" }}>{fileError}</div>}
    </div>
  );
}

export default function Home() {
  const [text, setText] = useState("");
  const [inputMode, setInputMode] = useState("text");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSample, setSelectedSample] = useState("");
  const [pdfData, setPdfData] = useState(null);
  const [sourceLabel, setSourceLabel] = useState(null);

  const analyzeText = useCallback(async () => {
    if (!text?.trim() && !pdfData) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let messages;
      if (pdfData) {
        messages = [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfData.base64 } },
            { type: "text", text: "Extract the main textual content from this document, then analyse it and map it onto the KTS framework. Respond only with JSON." },
          ],
        }];
      } else {
        const truncated = text.slice(0, 12000);
        messages = [{
          role: "user",
          content: `Analyse the following text and map it onto the KTS framework. Respond only with JSON.\n\nTEXT:\n${truncated}`,
        }];
      }

      // Call our own API route (not Anthropic directly)
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const responseText = data.content
        .map((item) => (item.type === "text" ? item.text : ""))
        .filter(Boolean)
        .join("\n");

      const clean = responseText.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(clean));
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [text, pdfData]);

  const handleSampleSelect = (key) => {
    setSelectedSample(key);
    setText(SAMPLE_TEXTS[key]);
    setInputMode("text");
    setPdfData(null);
    setSourceLabel(null);
    setResult(null);
  };

  const handleFileText = (extractedText, fileName, pdf) => {
    setSourceLabel(fileName);
    setSelectedSample("");
    setResult(null);
    if (pdf) { setPdfData(pdf); setText(""); }
    else { setPdfData(null); setText(extractedText || ""); }
  };

  const colors = result ? styleColors[result.style] || styleColors.Focused : null;
  const canAnalyze = text.trim() || pdfData;

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0f1e", color: "#c8d6e8",
      fontFamily: "'Georgia', 'Times New Roman', serif", padding: "24px 16px",
    }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 10, letterSpacing: 4, color: "#5a6f8f",
            textTransform: "uppercase", marginBottom: 8, fontFamily: "system-ui, sans-serif"
          }}>
            Prototype · Dimov &amp; Pistrui
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 400, color: "#e2ecf5", lineHeight: 1.2, margin: 0,
            borderBottom: "1px solid rgba(100,140,200,0.2)", paddingBottom: 16
          }}>
            Kinetic Thinking Styles<br />
            <span style={{ fontSize: 18, color: "#7a8faa", fontStyle: "italic" }}>Text Analyzer</span>
          </h1>
          <p style={{
            fontSize: 13, color: "#6a7f99", marginTop: 12, lineHeight: 1.6, maxWidth: 620
          }}>
            Maps written text onto the KTS framework by analysing linguistic markers
            of attitudes towards uncertainty (reason ↔ play) and possibility (structure ↔ openness).
          </p>
        </div>

        {/* Input mode tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
          {[{ key: "text", label: "Paste text" }, { key: "file", label: "Upload file" }].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setInputMode(tab.key); setResult(null); }}
              style={{
                padding: "8px 20px", fontSize: 12, fontFamily: "system-ui, sans-serif",
                letterSpacing: 1, textTransform: "uppercase",
                background: inputMode === tab.key ? "rgba(100,140,200,0.12)" : "transparent",
                border: "1px solid rgba(100,140,200,0.15)",
                borderBottom: inputMode === tab.key ? "1px solid #0a0f1e" : "1px solid rgba(100,140,200,0.15)",
                color: inputMode === tab.key ? "#a0bcdd" : "#5a6f8f",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Samples */}
        {inputMode === "text" && (
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 10, color: "#4a5f7f", marginBottom: 6,
              textTransform: "uppercase", letterSpacing: 2, fontFamily: "system-ui, sans-serif"
            }}>
              Sample texts
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.keys(SAMPLE_TEXTS).map((key) => (
                <button key={key} onClick={() => handleSampleSelect(key)} style={{
                  padding: "5px 12px", fontSize: 11, fontFamily: "Georgia, serif",
                  background: selectedSample === key ? "rgba(100,140,200,0.15)" : "rgba(100,140,200,0.05)",
                  border: `1px solid ${selectedSample === key ? "rgba(100,140,200,0.4)" : "rgba(100,140,200,0.1)"}`,
                  borderRadius: 3, color: selectedSample === key ? "#a0bcdd" : "#6a7f99", cursor: "pointer",
                }}>
                  {key}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        {inputMode === "text" ? (
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setSelectedSample(""); setPdfData(null); }}
            placeholder="Paste or type text to analyse..."
            style={{
              width: "100%", minHeight: 140, padding: 14, fontSize: 14, lineHeight: 1.7,
              fontFamily: "Georgia, serif", background: "rgba(15,23,42,0.8)",
              border: "1px solid rgba(100,140,200,0.15)", borderRadius: 6,
              color: "#c8d6e8", resize: "vertical", outline: "none", boxSizing: "border-box",
            }}
          />
        ) : (
          <FileUpload onTextExtracted={handleFileText} />
        )}

        {sourceLabel && inputMode === "file" && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#6a7f99", fontStyle: "italic" }}>
            Source: {sourceLabel}
          </div>
        )}

        <button
          onClick={analyzeText}
          disabled={loading || !canAnalyze}
          style={{
            marginTop: 12, padding: "10px 28px", fontSize: 13,
            fontFamily: "Georgia, serif", fontWeight: 600, letterSpacing: 1,
            background: loading ? "rgba(100,140,200,0.1)" : "rgba(100,140,200,0.15)",
            border: "1px solid rgba(100,140,200,0.3)", borderRadius: 4,
            color: loading || !canAnalyze ? "#5a6f8f" : "#a0bcdd",
            cursor: loading || !canAnalyze ? "default" : "pointer",
          }}
        >
          {loading ? "Analysing…" : "Analyse"}
        </button>

        {error && (
          <div style={{
            marginTop: 16, padding: 12,
            background: "rgba(200,80,80,0.1)", border: "1px solid rgba(200,80,80,0.2)",
            borderRadius: 4, fontSize: 13, color: "#e08080"
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ marginTop: 32, animation: "fadeIn 0.5s ease" }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

            <div style={{
              display: "inline-block", padding: "6px 18px",
              background: `${colors.accent}15`, border: `1px solid ${colors.accent}40`,
              borderRadius: 4, marginBottom: 20,
            }}>
              <span style={{
                fontSize: 11, color: "#6a7f99", textTransform: "uppercase",
                letterSpacing: 2, fontFamily: "system-ui, sans-serif"
              }}>
                Detected style:{" "}
              </span>
              <span style={{ fontSize: 16, color: colors.accent, fontWeight: 600 }}>
                {result.style}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
              <div>
                <KTSMatrix
                  uncertaintyScore={result.uncertainty_score}
                  possibilityScore={result.possibility_score}
                  style={result.style}
                />
              </div>
              <div>
                <DimensionBar
                  label="Attitude towards uncertainty" leftLabel="Reason"
                  rightLabel="Play" score={result.uncertainty_score} color="#c4798a"
                />
                <div style={{ fontSize: 13, color: "#8899bb", lineHeight: 1.6, marginBottom: 20 }}>
                  {result.uncertainty_reasoning}
                </div>
                <DimensionBar
                  label="Attitude towards possibility" leftLabel="Structure"
                  rightLabel="Openness" score={result.possibility_score} color="#7ab5a0"
                />
                <div style={{ fontSize: 13, color: "#8899bb", lineHeight: 1.6, marginBottom: 20 }}>
                  {result.possibility_reasoning}
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 24, padding: 16,
              background: "rgba(15,23,42,0.6)", border: "1px solid rgba(100,140,200,0.1)",
              borderRadius: 6,
            }}>
              <div style={{
                fontSize: 11, color: "#5a6f8f", textTransform: "uppercase",
                letterSpacing: 2, marginBottom: 10, fontFamily: "system-ui, sans-serif"
              }}>
                Key linguistic indicators
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.key_indicators?.map((ind, i) => (
                  <span key={i} style={{
                    padding: "4px 12px", fontSize: 12, fontStyle: "italic",
                    background: "rgba(100,140,200,0.08)",
                    border: "1px solid rgba(100,140,200,0.12)",
                    borderRadius: 3, color: "#8899bb",
                  }}>
                    &ldquo;{ind}&rdquo;
                  </span>
                ))}
              </div>
            </div>

            <div style={{
              marginTop: 16, padding: 16,
              borderLeft: `3px solid ${colors.accent}40`,
              background: `${colors.accent}08`,
              borderRadius: "0 6px 6px 0",
            }}>
              <div style={{ fontSize: 14, color: "#a0b4cc", lineHeight: 1.7, fontStyle: "italic" }}>
                {result.summary}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
