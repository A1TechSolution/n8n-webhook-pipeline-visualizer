# n8n Webhook Pipeline Visualizer

An interactive node-based visualizer designed to demonstrate how raw webhook payloads flow through backend automation chains in n8n or Make. It shows how data is received, parsed, normalized, and distributed across HubSpot CRMs, Slack channels, and SendGrid email services in parallel.

---

## 🌟 Features

* **Payload Event Presets**: Toggle between standard transaction payloads (Lead Signups, Stripe Charge Completions, Server CPU Spikes).
* **Live JSON Editor**: Edit or write your own custom JSON triggers directly in the config panel to test schema validation.
* **Animated Node Canvas**: Watch a glowing data pulse travel along the workflow connection wires during pipeline execution.
* **Payload Inspector**: Click on any node (Webhook, Transform, CRM, Slack, SendGrid) to inspect its inputs and outputs in a sleek JSON viewer.
* **Terminal Console Output**: A scrolling console showing execution times, response headers, and success/failure statuses.

---

## 🛠️ How to Use

1. Open `index.html` in any web browser.
2. Select a **Payload Event Preset** (e.g., *Lead Signed Up*) or write custom JSON inside the text editor.
3. Click **Execute Pipeline**.
4. Watch the pipeline nodes turn green as they succeed, and notice the log outputs in the bottom terminal.
5. Click on any node (e.g., *HubSpot CRM*) and click the **Input Data** or **Output Data** tabs in the inspector panel to see the exact mapped values.

---

## 💼 Business Value & Use Case

Connecting applications behind the scenes (middleware) is invisible to most business owners. This visualizer solves that:
* **Visualizes Invisible Value**: Shows clients exactly what an n8n or custom webhook workflow does.
* **Data Mapping Prototype**: Allows developers to conceptualize how data gets transformed from standard trigger schemas into CRM and SMTP parameters.
* **Sales Accelerator**: A powerful tool for automation agencies to sell complex integrations by making them visual and easy to understand.
