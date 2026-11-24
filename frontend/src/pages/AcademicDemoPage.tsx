import { Link } from 'react-router-dom';
import {
  Brain,
  Cpu,
  BarChart2,
  Image as ImageIcon,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export default function AcademicDemoPage() {
  return (
    <div className="stack" style={{ gap: 32, maxWidth: 1140, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#fff',
          padding: '36px',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', padding: '4px 12px', borderRadius: 20, marginBottom: 12 }}>
          <Brain size={14} color="#38bdf8" />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: '#38bdf8', textTransform: 'uppercase' }}>
            Academic Audit & Evaluation · Phase 7 Reconciled
          </span>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: '#fff' }}>
          Data Science & Deep Learning Empirical Evidence
        </h1>
        <p style={{ margin: '10px 0 0', color: '#94a3b8', fontSize: 15, maxWidth: 820, lineHeight: 1.6 }}>
          Reconciled empirical results and benchmark evidence for the four machine learning components of MallMind AI. All metrics reflect strictly leak-free evaluations, reproducible experiment logs, and documented academic constraints.
        </p>
      </div>

      {/* Model Overview Metric Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="row-between" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>Model 1 · DS</span>
            <BarChart2 size={18} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>Product Recommender</h3>
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, margin: 0 }}>
            Content-based vector ranking with hard attribute constraints on 304-item catalogue.
          </p>
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: '#10b981' }}>
            MAP@5: 1.000* · 33.55% Coverage
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>*Trivial due to circular relevance mask</div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="row-between" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>Model 2 · DL</span>
            <MessageSquare size={18} color="#3b82f6" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>TextCNN Intent Engine</h3>
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, margin: 0 }}>
            Subword 1D-CNN evaluated on 22 strict template-disjoint held-out test patterns (N=340).
          </p>
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: '#10b981' }}>
            Held-Out Test: 43.20% Macro-F1
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>44.41% Accuracy (Leak-Free Split)</div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="row-between" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase' }}>Model 3 · DL</span>
            <ImageIcon size={18} color="#8b5cf6" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>ResNet18 Classifier</h3>
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, margin: 0 }}>
            Transfer learning fine-tuned on Fashion-MNIST across 3 categories (N=720 test crops).
          </p>
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: '#10b981' }}>
            Top-1 Acc: 99.17% · F1: 99.16%
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Benchmark only; 75% error on real photos</div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="row-between" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>Model 4 · DS</span>
            <TrendingUp size={18} color="#d97706" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>Demand Forecaster</h3>
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, margin: 0 }}>
            HistGradientBoosting (GBDT) on 240-day chronological split (N=752 test days).
          </p>
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: '#10b981' }}>
            MAE: 2.77 · WAPE: 13.27%
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>-21.3% error vs Moving Average (16.87%)</div>
        </div>
      </div>

      {/* Model 1 & 2 Detailed Specifications */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 24 }}>
        {/* Model 1: Product Recommender */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Cpu size={20} color="var(--primary)" />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              1. Product Recommendation Engine
            </h2>
          </div>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            The content-based vector similarity engine ranks candidate products matching visitor budget, brand, and category constraints on a 304-item catalogue across 30 stores.
          </p>

          <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Evaluated Metrics & Circularity Analysis
            </div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Metric</th>
                  <th style={{ padding: '6px 8px' }}>Baseline (Category Filter)</th>
                  <th style={{ padding: '6px 8px' }}>Model (Vector Similarity)</th>
                  <th style={{ padding: '6px 8px' }}>Empirical Delta</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>MAP@5</td>
                  <td style={{ padding: '6px 8px' }}>1.000</td>
                  <td style={{ padding: '6px 8px' }}>1.000</td>
                  <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>Identical (Circular Mask)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>Catalogue Coverage</td>
                  <td style={{ padding: '6px 8px' }}>32.89%</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#10b981' }}>33.55%</td>
                  <td style={{ padding: '6px 8px', color: '#10b981' }}>+0.66% (+2 items explored)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>Intra-List Diversity</td>
                  <td style={{ padding: '6px 8px' }}>0.187</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#10b981' }}>0.195</td>
                  <td style={{ padding: '6px 8px', color: '#10b981' }}>+4.3% attribute spread</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>Inference Latency</td>
                  <td style={{ padding: '6px 8px' }}>1.20 ms</td>
                  <td style={{ padding: '6px 8px' }}>10.09 ms</td>
                  <td style={{ padding: '6px 8px' }}>+8.89 ms vector overhead</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong>Methodological Finding:</strong> The reported MAP@5 of 1.000 is the mathematical consequence of a circular ground-truth relevance function that identically duplicated the candidate filtering mask. Genuine differentiation is demonstrated through higher coverage and list diversity.
          </div>
        </div>

        {/* Model 2: TextCNN Intent Engine */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <MessageSquare size={20} color="#3b82f6" />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              2. TextCNN Multilingual Intent Classifier
            </h2>
          </div>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            Powers the multilingual AI Concierge by classifying visitor queries in English, Hindi, and Gujarati into 8 shopping intents.
          </p>

          <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Strict Template-Disjoint Holdout (N = 340, 22 Unseen Templates)
            </div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Model Architecture</th>
                  <th style={{ padding: '6px 8px' }}>Accuracy</th>
                  <th style={{ padding: '6px 8px' }}>Macro-F1</th>
                  <th style={{ padding: '6px 8px' }}>Generalization Note</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px' }}>Rule-Based Matcher</td>
                  <td style={{ padding: '6px 8px' }}>29.71%</td>
                  <td style={{ padding: '6px 8px' }}>37.19%</td>
                  <td style={{ padding: '6px 8px' }}>Fails on phrasing variation</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px' }}>Logistic Regression</td>
                  <td style={{ padding: '6px 8px' }}>39.71%</td>
                  <td style={{ padding: '6px 8px' }}>38.00%</td>
                  <td style={{ padding: '6px 8px' }}>Bag-of-words linear baseline</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px' }}>Word-Level TextCNN</td>
                  <td style={{ padding: '6px 8px' }}>13.50%</td>
                  <td style={{ padding: '6px 8px' }}>12.70%</td>
                  <td style={{ padding: '6px 8px' }}>Severe out-of-vocab penalty</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#10b981' }}>Subword TextCNN (Final)</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#10b981' }}>44.41%</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#10b981' }}>43.20%</td>
                  <td style={{ padding: '6px 8px', color: '#10b981' }}>Best leak-free model</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong>Discrepancy Clarification:</strong> While random 70/15/15 splits yielded inflated validation metrics (~90.9% to 100%) due to template memorization, strict leak-free evaluation yields 43.20% Macro-F1. High confidences (99.8% Gujarati, 97.3% Hindi) represent single-query softmax scores on seen templates, not unseen test accuracy (38.7% Gujarati, 53.3% Hindi).
          </div>
        </div>

        {/* Model 3: ResNet18 Product Image Classifier */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <ImageIcon size={20} color="#8b5cf6" />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              3. ResNet18 Product Image Classifier
            </h2>
          </div>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            Transfer-learning visual feature extractor and classifier fine-tuned on Fashion-MNIST across 3 super-categories: Apparel, Bags & Accessories, and Footwear.
          </p>

          <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Held-Out Benchmark Split (N = 720, Xiao et al. 2017)
            </div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Model</th>
                  <th style={{ padding: '6px 8px' }}>Top-1 Accuracy</th>
                  <th style={{ padding: '6px 8px' }}>Macro-F1</th>
                  <th style={{ padding: '6px 8px' }}>Inference Latency</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px' }}>Pixel Logistic Regression</td>
                  <td style={{ padding: '6px 8px' }}>97.22%</td>
                  <td style={{ padding: '6px 8px' }}>97.21%</td>
                  <td style={{ padding: '6px 8px' }}>1.8 ms</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#10b981' }}>ResNet-18 Transfer Learning</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#10b981' }}>99.17%</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#10b981' }}>99.16%</td>
                  <td style={{ padding: '6px 8px' }}>14.85 ms (CPU)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong>Documented Domain Gap:</strong> While achieving 99.17% on benchmark crops, the model exhibits a 75% error rate on raw, uncropped real retail photography. In production, a confidence guardrail flags predictions with confidence &lt; 0.50, requiring retailer manual confirmation.
          </div>
        </div>

        {/* Model 4: Ridge & GBDT Demand Forecaster */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <TrendingUp size={20} color="#d97706" />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              4. Retail Demand Forecaster
            </h2>
          </div>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
            Category interaction forecaster predicting daily search volume across 16 retail categories to assist store managers with replenishment thresholds.
          </p>

          <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Chronological Split Benchmark (N = 752 Held-Out Test Days)
            </div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Forecasting Model</th>
                  <th style={{ padding: '6px 8px' }}>MAE</th>
                  <th style={{ padding: '6px 8px' }}>RMSE</th>
                  <th style={{ padding: '6px 8px' }}>WAPE</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px' }}>7-Day Moving Avg Baseline</td>
                  <td style={{ padding: '6px 8px' }}>3.52</td>
                  <td style={{ padding: '6px 8px' }}>4.92</td>
                  <td style={{ padding: '6px 8px' }}>16.87%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px' }}>Ridge Regression (α=1.0)</td>
                  <td style={{ padding: '6px 8px' }}>2.99</td>
                  <td style={{ padding: '6px 8px' }}>4.08</td>
                  <td style={{ padding: '6px 8px' }}>14.32%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px' }}>Random Forest (100 Trees)</td>
                  <td style={{ padding: '6px 8px' }}>2.92</td>
                  <td style={{ padding: '6px 8px' }}>3.97</td>
                  <td style={{ padding: '6px 8px' }}>13.98%</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#10b981' }}>HistGradientBoosting (GBDT)</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#10b981' }}>2.77</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#10b981' }}>3.78</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: '#10b981' }}>13.27%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong>Data Sufficiency Note:</strong> Because the live database contains only 18 sandbox orders, models were trained on a 240-day simulated Poisson interaction series (3,840 rows). Predictions carry an explicit demonstration basis note.
          </div>
        </div>
      </div>

      {/* Documented Academic Limitations & Defensibility */}
      <div
        className="card"
        style={{
          padding: 28,
          border: '1px solid #fed7aa',
          background: '#fffaf5',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <AlertTriangle size={20} color="#ea580c" />
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#9a3412' }}>
            Four Documented Academic Limitations & Defensibility
          </h2>
        </div>
        <p style={{ fontSize: 13, color: '#7c2d12', lineHeight: 1.6, marginBottom: 16 }}>
          In accordance with rigorous academic engineering standards, the following four methodological limitations are formally documented:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #fed7aa' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#9a3412', margin: '0 0 6px' }}>
              1. Circular Relevance Labels
            </h4>
            <p style={{ fontSize: 12, color: '#7c2d12', margin: 0, lineHeight: 1.5 }}>
              The recommendation evaluation ground-truth relevance function identically duplicated the candidate filter mask. While proving hard constraint satisfaction, it does not assess rank-ordering preferences within the filtered set.
            </p>
          </div>

          <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #fed7aa' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#9a3412', margin: '0 0 6px' }}>
              2. TextCNN Generalisation
            </h4>
            <p style={{ fontSize: 12, color: '#7c2d12', margin: 0, lineHeight: 1.5 }}>
              Random split evaluations severely overstate accuracy (~90-100%) due to template memorization. On strictly unseen template patterns, accuracy drops to 44.41% (43.20% Macro-F1), highlighting the need for expansive real query logs.
            </p>
          </div>

          <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #fed7aa' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#9a3412', margin: '0 0 6px' }}>
              3. Image Classifier Domain Gap
            </h4>
            <p style={{ fontSize: 12, color: '#7c2d12', margin: 0, lineHeight: 1.5 }}>
              High benchmark accuracy (99.17%) on 28x28 Fashion-MNIST crops degrades to 25% accuracy on raw retail store photography. Real-world deployment requires high-resolution multi-angle retail datasets and background segmentation.
            </p>
          </div>

          <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #fed7aa' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#9a3412', margin: '0 0 6px' }}>
              4. Synthetic Demand Series
            </h4>
            <p style={{ fontSize: 12, color: '#7c2d12', margin: 0, lineHeight: 1.5 }}>
              With only 18 live database orders (&lt;24 hours old), historical data is statistically insufficient. Forecasting was trained on a 240-day simulated series and serves as an architectural demonstration rather than real predictive telemetry.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Return Links */}
      <div className="row-between" style={{ padding: '16px 0', borderTop: '1px solid var(--border)' }}>
        <Link to="/" className="btn btn-secondary">
          ← Return to Mall Homepage
        </Link>
        <div className="row" style={{ gap: 10 }}>
          <Link to="/directory" className="btn btn-secondary">
            View Store Directory
          </Link>
          <Link to="/map" className="btn btn-primary">
            Explore 5-Floor Map <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
