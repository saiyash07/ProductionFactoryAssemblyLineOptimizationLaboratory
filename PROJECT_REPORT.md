# Production Factory Assembly Line Optimization Laboratory

> **ITM Skills University | Case Study #178**  
> A high-performance, real-time discrete event simulation laboratory dashboard built in **React.js & Vite** with Vanilla CSS, designed to model, analyze, and optimize production factory assembly line operations.

---

## 3.1 Cover Page

* **Project Title**: Production Factory Assembly Line Optimization Laboratory
* **Institution**: ITM Skills University
* **Course**: ReactJS Application Development — Case Study Submission
* **Case Study Number**: 178

## 3.2 Student Details

* **Student Name**: Saiyash Poojari
* **Cohort**: SAM ALTMAN
* **Roll No**: 150096725136
* **Institution**: ITM Skills University
* **Case Study Number**: 178
* **Subject**: ReactJS Case Study
* **Submission Type**: Case Study Project Report

## 3.3 Project Title

### **Production Factory Assembly Line Optimization Laboratory**
An interactive, browser-based discrete event simulator that models industrial assembly lines, helps identify bottlenecks in real-time, injects failures stochastically to test line resiliency, and performs balance optimization using compiler-inspired scheduling heuristics.

---

## 3.4 Problem Statement

In modern manufacturing, assembly lines are complex pipelines where workstations must operate in harmony. Designing and optimizing these layouts physically is expensive, risky, and slow. Legacy simulation systems suffer from:

| Problem | Impact |
|---|---|
| Lack of real-time pipeline visibility | Unidentified operational bottlenecks |
| Hardcoded layout configurations | Inability to test new layout topologies |
| No stochastic failure modeling | Failure to predict impacts of machine breakdowns |
| Complex calculation methods | Out-of-sync OEE and line-balancing calculations |
| High server infrastructure dependency | High operating costs for simple simulations |

---

## 3.5 Objectives

The project is designed to achieve the following specific objectives:

1. **Objective 1**: Implement a real-time reactive simulation engine in the browser utilizing `requestAnimationFrame` and delta-timing to process item queues at high frame rates.
2. **Objective 2**: Create a dynamic configuration dashboard to add, edit, or delete workstations and adjust their parameters (cycle times, defect rates, buffer capacities) on-the-fly.
3. **Objective 3**: Implement dynamic mathematical indicators for **Overall Equipment Effectiveness (OEE)** and **Line Balancing Efficiency (LE%)** updating in real time.
4. **Objective 4**: Design compiler-inspired heuristics logic to automatically redistribute tasks evenly across all machines to eliminate bottlenecks (raising Line Efficiency to 100%).
5. **Objective 5**: Provide serverless data capabilities including persistent state configurations using `LocalStorage` and operational log export using browser `Blob` CSV generation APIs.

---

## 3.6 Features & React Hook Mapping

| # | Feature | React Implementation | Complexity | Real-World Mapping |
|---|---|---|---|---|
| 1 | **Simulation Loop** | `useEffect` + `requestAnimationFrame` + `useRef` | O(N) per frame | Real-time PLC system scheduler |
| 2 | **Workstation Parametrics** | Array State (`useState`) | O(1) edits | Manufacturing Execution System (MES) |
| 3 | **Staged Queues** | Staging Buffer Arrays (FIFO) | O(1) queue shift | Conveyor belt buffer accumulation |
| 4 | **Config Persistence** | LocalStorage Sync (`useEffect`) | O(N) serialization | Controller configuration database |
| 5 | **OEE Calculator** | Derivative State Formula | O(N) calculation | Production quality control dashboard |
| 6 | **Line Balancing Heuristics** | Task Time Redistribution Function | O(N) adjustment | Lean Manufacturing compiler optimizer |
| 7 | **Log Exporter** | Blob API + Object URL Generation | O(L) generation | Industrial SCADA data logger |

---

## 3.7 Technical Details & Architecture

### **Architecture Diagram**
```
┌─────────────────────────────────────────────────────────────┐
│                 React Factory Laboratory                    │
│                                                             │
│  ┌─────────────────┐   ┌─────────────────┐   ┌───────────┐  │
│  │   Control Panel │   │  State Engine   │   │ HUD tiles │  │
│  │  - Add/Del Node │   │  - cycle times  │   │ - OEE %   │  │
│  │  - Speed Select │   │  - fail/repair  │   │ - LE %    │  │
│  └────────┬────────┘   └────────┬────────┘   └─────▲─────┘  │
│           │                     │                  │        │
│           └───────────┬─────────┘                  │        │
│                       ▼                            │        │
│  ┌─────────────────────────────────────────────────┴─────┐  │
│  │    Render View (Virtual DOM Reconciliation)            │  │
│  │    - CSS Conveyor Queue Layout                        │  │
│  │    - Real-Time Progress Visualizer Bars               │  │
│  │    - Telemetry Terminal Logs window                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

* **Framework**: React 19 (via Vite)
* **Styling**: Vanilla CSS utilizing custom properties for light-industrial theme controls
* **Rendering**: Virtual DOM reconciliation utilizing standard HTML elements and absolute-positioned token overlays
* **Build System**: Vite Bundler

---

## 3.8 Heuristics & Mathematics Formulae

### **1. Line Balancing Efficiency (LE%)**
Matches task times of workstations to identify underutilized resources:
$$\text{Line Efficiency (LE\%)} = \left( \frac{\sum_{i=1}^{n} T_i}{n \times \max(T)} \right) \times 100$$
*Where $T_i$ is the cycle time of workstation $i$, and $n$ is the total number of workstations.*

### **2. Overall Equipment Effectiveness (OEE%)**
Calculates the operational quality based on:
$$\text{OEE\%} = \text{Availability} \times \text{Performance} \times \text{Quality} \times 100$$
* **Availability**: Ratio of up nodes to total nodes.
* **Performance**: Calculated using the Line Efficiency ratio.
* **Quality**: Ratio of total non-defective units divided by total items processed.

### **3. Line Balancing Heuristic Algorithm**
Redistributes the cycle times of all nodes to the target average cycle time:
$$\text{Target Cycle Time} = \frac{\sum_{i=1}^{n} T_i}{n}$$
This ensures all workstations perform at equal rates, achieving $100\%$ Line Efficiency and eliminating queue build-ups.

---

## 3.9 Project Structure

```
ReactJS(CASE STUDY)/
├── package.json         # Project manifests and scripts
├── vite.config.js       # Vite bundler configuration
├── index.html           # Single-page HTML shell
├── src/
│   ├── main.jsx         # React application mounting entry point
│   ├── App.jsx          # Simulation loop, UI rendering, calculations
│   └── index.css        # Factory visualization theme styles
└── PROJECT_REPORT.md    # Case study submission report
```

---

## 3.10 License

This project is licensed under the **MIT License** — see the LICENSE file for details.

---

## Author

**Saiyash Poojari**  
ITM Skills University — ReactJS Case Study #178  
Cohort: SAM ALTMAN  
Roll No: 150096725136  
