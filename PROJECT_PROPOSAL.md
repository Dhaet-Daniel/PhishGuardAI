# PROJECT PROPOSAL

**Faculty of Information and Communications Technology (ICT)**

**Cavendish University Zambia**

---

**PROJECT TITLE:** Explainable AI-Powered Phishing Email Detection and Risk Analysis

**Proposed by:** Nestony Biamungu
**Student Number:** 105-994
**Email:** nb105994@students.cavendish.co.zm
**Mobile Number:** +260 776 669 320

---

## Table of Contents

- **CHAPTER ONE: INTRODUCTION**
  - 1.0 Introduction
  - 1.1 Background
  - 1.2 Motivation of the Study
  - 1.3 Significance of the Study
  - 1.4 Scope of the Study
  - 1.5 Problem Statement
  - 1.6 Objectives
    - 1.6.1 General Objective
    - 1.6.2 Specific Objectives
  - 1.7 Research Questions
  - 1.8 Conceptual/Theoretical Framework
  - 1.9 Definition of Terms
  - 1.10 Organization of the Report
- **CHAPTER TWO: LITERATURE REVIEW**
  - 2.0 Overview
  - 2.1 Literature Review
  - 2.2 Related Works
  - 2.3 Gaps in the Literature
- **CHAPTER THREE: RESEARCH DESIGN AND SYSTEM DEVELOPMENT**
  - 3.0 Overview
  - 3.1 Research Design
  - 3.2 Baseline Study
    - 3.2.1 Data Collection
    - 3.2.2 Research Approach
    - 3.2.3 Development of the Application
  - 3.3 System Design
    - 3.3.1 Context Diagram
    - 3.3.2 System Software Level Architectural Design
    - 3.3.3 Modular Design of System Functions
    - 3.3.4 System Class Diagram
    - 3.3.5 System Data Model Design
    - 3.3.6 Development Timeline
- **Bibliography**

---

## CHAPTER ONE: INTRODUCTION

### 1.0 INTRODUCTION

Organisations globally face challenges in protecting their email communication
effectively. Phishing remains one of the most common cyber-attacks, in which
attackers craft emails that imitate trusted senders to steal credentials,
payment details, or system access (Khonji, Iraqi & Jones, 2013). Detecting these
messages traditionally relies on either automated black-box filters or manual
inspection by users, both of which have limitations: filters rarely explain their
decisions, and non-technical users cannot evaluate email headers, sender
alignment, or destination URLs (Dhamija, Tygar & Hearst, 2006).

PhishGuardAI addresses this gap at Cavendish University Zambia and similar
institutions, where students and staff receive large volumes of email with no
reliable way to verify whether a message is legitimate. This study aims to
develop an AI-powered, explainable phishing detection system that scores an
email, classifies its risk, and shows a human-readable breakdown of the signals
behind the verdict (Whittaker, Ryner & Nazif, 2010).

### 1.1 BACKGROUND

Phishing detection has evolved from simple rule-based spam filters to machine
learning classifiers that examine message text, sender properties, and URL
patterns (Khonji, Iraqi & Jones, 2013). Modern systems combine multiple signals
— keyword urgency, sender reputation, link analysis, and authentication headers
such as SPF, DKIM, and DMARC — to produce a risk assessment.

However, most deployed tools return only a verdict, leaving users unable to
learn why a message was flagged. Research on user behaviour shows that people
fall for phishing partly because they do not understand the warning signals
(Dhamija, Tygar & Hearst, 2006). Explainable systems therefore serve a dual
purpose: they make accurate decisions and they educate users.

In Zambia, AI-based email security tools are rare, and email users largely rely
on judgement or basic inbox spam folders. This study targets the common
indicators available on any email — subject, sender, body, headers, links, and
attachments — to generate explainable phishing risk insights automatically.

### 1.2 MOTIVATION OF THE STUDY

The study is motivated by the need to modernize email screening and provide
actionable, understandable insights to everyday users. A system that explains
*why* a message is suspicious allows users to act safely on legitimate mail and
avoid dangerous messages, reducing the success rate of phishing attacks.
Additionally, the project provides practical experience in artificial
intelligence, software engineering, and full-stack web development, supporting
the student's professional growth (Pressman, 2014).

### 1.3 SIGNIFICANCE OF THE STUDY

**For Email Users:** Enables informed decisions about suspicious messages,
reduces the risk of credential theft, and teaches users the indicators of
phishing through visible explanations (Dhamija, Tygar & Hearst, 2006).

**For Administrators:** Provides a review console for stored results, user
feedback on wrong verdicts, and platform statistics that support data-driven
security decisions.

**For the University:** Enhances the security posture of institutional email
communication and modernises awareness practices without requiring specialist
security staff.

**For Research:** Contributes to explainable AI applications for phishing
detection in the Zambian context, combining weighted heuristics with optional
machine learning and human feedback.

### 1.4 SCOPE OF THE STUDY

- Developing a multi-signal scoring model using email keywords, sender
  properties, URLs, authentication headers, attachments, urgency cues, and an
  optional machine-learning classifier.
- Building a web-based system that allows authenticated users to scan single or
  batches of up to ten emails, view their scan history, and submit feedback on
  verdicts.
- Implementing data storage using a SQLite database through SQLAlchemy, a
  RESTful backend with FastAPI, and dashboards with React.js and Tailwind CSS.
- Providing an offline evaluation harness that measures prediction accuracy,
  category accuracy, false positives, and false negatives against a labelled
  email dataset.

The study is limited to email content analysis (headers supplied with the
message) and does not include network-level traffic inspection, inbox
integration, or real-time mail-server deployment.

### 1.5 PROBLEM STATEMENT

Email users at Cavendish University Zambia currently rely on manual judgement
or basic inbox filtering to decide whether an email is genuine, which is
time-consuming, inconsistent, and reactive. Users often cannot identify
suspicious senders, mismatched links, or failed authentication headers, and
existing filters do not explain their decisions. Consequently, phishing
messages succeed because recipients cannot verify them. This research proposes
an AI-powered, explainable detection system to address this problem (Whittaker,
Ryner & Nazif, 2010).

### 1.6 OBJECTIVES

#### 1.6.1 GENERAL OBJECTIVE

To develop an explainable AI-powered system for detecting phishing emails using
message content, sender properties, URLs, headers, and optional machine-learning
scoring.

#### 1.6.2 SPECIFIC OBJECTIVES

1. Analyse the relationship between suspicious keyword patterns and phishing
   classification.
2. Evaluate how sender properties, URLs, and authentication headers contribute
   to phishing risk.
3. Assess the impact of urgency cues and risky attachment metadata on the risk
   of a message being malicious.
4. Develop an AI-based scoring model that combines weighted heuristics with an
   optional zero-shot machine-learning classifier.
5. Implement a web-based dashboard for users and administrators to scan emails,
   monitor results, and review explained verdicts.

### 1.7 RESEARCH QUESTIONS

1. How do suspicious keyword patterns influence the classification of an email
   as phishing?
2. What is the combined effect of sender analysis, URL inspection, and header
   authentication on phishing detection accuracy?
3. How do urgency cues and attachment metadata correlate with high-risk
   messages?
4. Can an explainable AI scoring model accurately classify emails and assign
   risk levels based on the selected signals?
5. How can a dashboard interface enhance users' and administrators' ability to
   understand and act on detection results?

### 1.8 CONCEPTUAL/THEORETICAL FRAMEWORK

The study will be guided by Signal-Fusion Detection Theory and Explainable AI
Theory:

- **Signal-Fusion Detection:** Phishing evidence is distributed across
  independent indicators (language, sender, links, headers, attachments); no
  single feature is sufficient, but combining weighted signals produces a
  reliable decision (Khonji, Iraqi & Jones, 2013).
- **Explainable AI:** Model decisions must expose their contributing factors so
  that humans can understand, trust, and act on them (Dhamija, Tygar & Hearst,
  2006).

**Conceptual Model:**

```
[Subject, Sender, Body, Headers, Links, Attachments]
        → AI Signal Analysers → Weighted Raw Score
        → Trust Credit Adjustment → Adjusted Score
        → Verdict (Phishing/Safe) + Risk Level (Low/Medium/High)
        → Analysis Breakdown → User & Administrator Action
```

### 1.9 DEFINITION OF TERMS

- **Scoring Model:** Weighted combination of signal contributions producing a
  0–1 phishing risk score.
- **Analysis Breakdown:** Per-signal explanation of how much each indicator
  contributed to the final score.
- **Risk Level:** Classification of a message's likelihood of being phishing
  (High, Medium, Low).
- **Trust Credit:** Score reduction applied when legitimacy signals (passing
  authentication headers, newsletter or transactional language) are present.
- **Verdict:** Final prediction of a message as `Phishing` or `Safe`.

### 1.10 ORGANIZATION OF THE REPORT

- Chapter One: Introduction
- Chapter Two: Literature Review and Related Work
- Chapter Three: Research Design and System Development
- Chapter Four: Results and Analysis
- Chapter Five: Discussion, Conclusion, and Recommendations

---

## CHAPTER TWO: LITERATURE REVIEW

### 2.0 OVERVIEW

This chapter reviews current research and applications of AI in phishing email
detection, identifies gaps, and establishes the foundation for the proposed
explainable detection system (Khonji, Iraqi & Jones, 2013).

### 2.1 LITERATURE REVIEW

**Global Perspective:** Phishing detection research combines content-based
features (keywords, structure), header analysis, and URL features with machine
learning techniques such as Random Forest, Logistic Regression, Naïve Bayes, and
zero-shot transformer classifiers. Surveys show that hybrid approaches outperform
single-feature detectors (Khonji, Iraqi & Jones, 2013).

**Human Perspective:** Studies show that users fall for phishing attacks largely
because warning cues are either absent or unexplained; interfaces that explain
risk improve user decisions (Dhamija, Tygar & Hearst, 2006). Large-scale
automatic classifiers demonstrate that machine learning can classify phishing
pages and messages at scale, yet deployed tools rarely expose their reasoning to
end users (Whittaker, Ryner & Nazif, 2010).

**Local Perspective:** In Zambia, there is limited research on AI-based email
security systems for higher education, especially those combining heuristic and
machine-learning signals with explainable output.

**Gap Identified:** Existing systems rarely combine weighted multi-signal
scoring with a per-signal explanation, human feedback capture, and configurable
machine learning, creating an opportunity for a unique, explainable detection
system.

### 2.2 RELATED WORKS

- Khonji, Iraqi & Jones (2013) – Literature survey of phishing detection
  techniques across email, URLs, and web content.
- Dhamija, Tygar & Hearst (2006) – Empirical study showing why users fall for
  phishing and the value of clearer warning signals.
- Whittaker, Ryner & Nazif (2010) – Large-scale automatic classification of
  phishing pages using machine learning.
- Romero & Ventura (2010) – Review of data mining techniques applicable to
  pattern-based classification problems.
- Kotsiantis et al. (2004) – Machine learning approaches to classification and
  prediction problems.

**Observation:** Most models focus on raw accuracy only; they do not integrate
per-signal explanations, human feedback loops, or runtime configuration of
optional AI components.

### 2.3 GAPS IN THE LITERATURE

- Lack of explainable AI-based phishing detection systems in the Zambian
  context.
- Minimal integration of weighted heuristics, header authentication analysis,
  and optional machine learning in a single open scoring model.
- Few systems provide actionable, per-signal explanations and feedback loops
  for end users and administrators (Khonji, Iraqi & Jones, 2013).

---

## CHAPTER THREE: RESEARCH DESIGN AND SYSTEM DEVELOPMENT

### 3.0 OVERVIEW

This chapter outlines the research design, system architecture, data collection
methods, and development process of the proposed Explainable AI Phishing Email
Detection System (Pressman, 2014).

### 3.1 RESEARCH DESIGN

**Design:** Quantitative, descriptive, and predictive research.
**Justification:** Allows collection and analysis of labelled email data
(keywords, headers, URLs, verdicts) and supports evaluation of AI-based
classification accuracy (Sommerville, 2011).

### 3.2 BASELINE STUDY

#### 3.2.1 DATA COLLECTION

**Tools:** A labelled email dataset maintained with the system
(`backend/evaluation/sample_emails.json`), extensible with real-world emails
imported through a dataset utility script.
**Data Points:** Subject, sender, body text, headers (SPF/DKIM/DMARC results,
Reply-To, Return-Path), links, attachment metadata, expected prediction
(Phishing/Safe), and expected category.

#### 3.2.2 RESEARCH APPROACH

Quantitative analysis with explainable scoring. The detector combines weighted
heuristics (keyword, sender, URL, header, attachment, urgency, and brand
alignment signals) with an optional zero-shot machine-learning classifier
(`facebook/bart-large-mnli`) and WHOIS domain-age checks, each individually
enable/disable configurable. Accuracy, category accuracy, false positives, and
false negatives are measured offline against the labelled dataset.

#### 3.2.3 DEVELOPMENT OF THE APPLICATION

- **Backend:** Python with FastAPI, SQLAlchemy ORM, SQLite database, JWT
  authentication (HS256) with bcrypt password hashing, and slowapi rate
  limiting (Pressman, 2014).
- **Frontend:** React.js 19 + Tailwind CSS, built with Vite, using
  react-router-dom for protected user and administrator areas.
- **Database:** SQLite (`phishguard.db`) — a self-contained, zero-configuration
  database suitable for an academic deployment (Sommerville, 2011).
- **Machine Learning (optional):** Hugging Face transformers, spaCy, and WHOIS
  lookups, feature-flag gated so the system degrades gracefully to pure
  heuristics.

### 3.3 SYSTEM DESIGN

#### 3.3.1 CONTEXT DIAGRAM

```
[Email Users] -------> [System: Submit Email, Receive Explained Verdict]
[Administrators] ----> [System: Manage Users/Results/Feedback/Feature Flags]
[AI/ML Module] ------> [System: Optional Zero-Shot Phishing Score]
[WHOIS Service] -----> [System: Optional Domain-Age Risk Signal]
[Labelled Dataset] --> [Evaluation Module: Accuracy, FP/FN Report]
```

#### 3.3.2 SYSTEM SOFTWARE LEVEL ARCHITECTURAL DESIGN

- **Presentation Layer:** React.js dashboard (scanner, batch scanner, history,
  settings, admin console).
- **Application Layer:** FastAPI routers — authentication, prediction, results,
  feedback, settings, admin — guarded by JWT role dependencies and rate limits.
- **Detection Layer:** Detector service combining independent signal analysers,
  trust-credit adjustment, and verdict/threshold classification.
- **Data Layer:** SQLite database via SQLAlchemy (users, detection results,
  feedback, sign-up requests, trusted domains, feature flags, feature requests).

#### 3.3.3 MODULAR DESIGN OF SYSTEM FUNCTIONS

- **Authentication Module:** JWT login, role-based access (user/admin),
  moderated sign-up with trusted-domain auto-approval.
- **Detection Module:** Weighted multi-signal scoring producing verdict, risk
  level, category, and per-signal analysis breakdown.
- **Persistence Module:** Stores every analysis and its explanation for history
  and administrator review.
- **Feedback Module:** Human review of verdicts (false positives/negatives) with
  administrator responses.
- **Feature Flag Module:** Global, per-user, and environment toggles for the
  optional ML and WHOIS components.
- **Dashboard Module:** Displays explained insights for users (gauge, verdict
  badge, breakdown) and statistics for administrators.
- **Evaluation Module:** Offline accuracy reporting against the labelled dataset.

#### 3.3.4 SYSTEM CLASS DIAGRAM

```
Class User
- id - email - hashed_password - role
- scan_history() - submit_feedback()

Class DetectionResult
- id - subject - sender - body - prediction - category - confidence
- score - risk_level - risk_signals - trust_signals - analysis_breakdown
- recommended_actions - created_at - user_id
- get_breakdown() - get_summary()

Class Feedback
- id - detection_result_id - actual_prediction - user_feedback
- admin_response - status - reason - created_at
- respond() - resolve()

Class SignupRequest
- id - full_name - email - organization - status - created_at
- approve() - reject()

Class TrustedDomain
- id - domain
- is_auto_approvable()

Class Administrator (role = admin)
- admin_id - email
- view_users() - view_results() - review_feedback() - toggle_flags()

Class Detector
- keyword_score - sender_score - url_score - header_score
- attachment_score - urgency_score - ml_score - alignment_score
- trust_credit - adjusted_score
- analyse() - classify_verdict() - classify_risk_level()
```

#### 3.3.5 SYSTEM DATA MODEL DESIGN

**SQLite Tables (via SQLAlchemy):**

```
users
  id, email (unique), hashed_password, role (user|admin)

detection_results
  id, subject, sender, body, prediction, category, confidence, score,
  risk_level, matched_keywords, reason, summary, risk_signals,
  trust_signals, recommended_actions, analysis_breakdown, headers,
  attachment_metadata, created_at, user_id (FK → users)

feedback
  id, email_id, detection_result_id (FK → detection_results),
  actual_prediction, user_feedback, admin_response, status,
  matched_keywords, reason, created_at

signup_requests
  id, full_name, email (unique), organization, hashed_password,
  status (pending|approved|rejected|auto_approved), created_at

trusted_domains
  id, domain (unique)

user_features
  id, user_id (FK → users), feature_name, enabled

feature_requests
  id, user_email, feature_name, status, created_at
```

#### 3.3.6 DEVELOPMENT TIMELINE

- **Weeks 1–2:** Finalize project topic, conduct literature review, define
  objectives, and identify labelled email datasets.
- **Weeks 3–4:** Collect and pre-process email data (subjects, senders, bodies,
  headers, links, attachments); define signal features and scoring weights.
- **Weeks 5–7:** Develop the detection engine — keyword, sender, URL, header,
  attachment, urgency, and alignment analysers; integrate the optional
  zero-shot ML classifier; calibrate thresholds (Phishing ≥ 0.58; risk levels
  Low/Medium/High at 0.35/0.75).
- **Weeks 8–10:** Design system architecture; build the FastAPI backend with JWT
  authentication, rate limiting, persistence, and feedback endpoints; integrate
  feature flags.
- **Weeks 11–12:** Develop the frontend dashboard using React.js & Tailwind
  CSS; implement user views (scanner, batch, history, settings) and the
  administrator console (users, results, feedback, domains, flags).
- **Weeks 13–14:** Test the system with the labelled dataset; evaluate accuracy,
  false-positive and false-negative rates; run the automated test suite; fix
  bugs and optimize performance.
- **Weeks 15–16:** Write dissertation chapters, add figures/diagrams, finalize
  documentation, and prepare the presentation.

---

## BIBLIOGRAPHY

1. Dhamija, R., Tygar, J. D. & Hearst, M., 2006. Why Phishing Works.
   *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems
   (CHI '06)*, pp. 499–506.
2. Khonji, M., Iraqi, Y. & Jones, A., 2013. Phishing Detection: A Literature
   Survey. *IEEE Communications Surveys & Tutorials*, 15(4), pp. 2091–2121.
3. Kotsiantis, S. P. C. & P. P., 2004. Predicting Students' Performance in
   Distance Learning Using Machine Learning Techniques. *Applied Artificial
   Intelligence*, Volume 18(5), pp. 411–426.
4. Pressman, R., 2014. *Software Engineering: A Practitioner's Approach*. 7th
   ed. ed. New York: McGraw-Hill.
5. Romero, C. & Ventura, S., 2010. Educational Data Mining: A Review of the
   State-of-the-Art. *IEEE Transactions on Systems, Man, and Cybernetics*, 40(6),
   pp. 601-618.
6. Sommerville, I., 2011. *Software Engineering*. 9th ed. ed. Boston:
   Addison-Wesley.
7. Whittaker, C., Ryner, B. & Nazif, M., 2010. Large-Scale Automatic
   Classification of Phishing Pages. *Proceedings of the Network and Distributed
   System Security Symposium (NDSS '10)*.

> **Note:** References 3–6 are carried over from the sample proposal; references
> 1, 2, and 7 are standard phishing-detection literature. Verify all citations
> against the original sources before submission.
