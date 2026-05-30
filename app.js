// --- Payload Presets ---
const PRESETS = {
    signup: {
        event: "form.submit",
        timestamp: "2026-05-30T11:45:00Z",
        data: {
            name: "Jane Doe",
            email: "jane.doe@example.com",
            company: "Acme Corp",
            phone: "+15551234567",
            message: "Interested in your AI calling receptionist services. Need ASAP."
        }
    },
    stripe: {
        event: "charge.succeeded",
        timestamp: "2026-05-30T11:46:12Z",
        data: {
            customer_id: "cus_Njk31A9",
            email: "payments@acme.com",
            amount: 250000,
            currency: "usd",
            description: "Enterprise AI Receptionist Suite - Annual Plan"
        }
    },
    alert: {
        event: "system.cpu_spike",
        timestamp: "2026-05-30T11:47:33Z",
        data: {
            server_id: "prod-voice-node-03",
            cpu_load: 96.8,
            memory_usage: "88%",
            severity: "CRITICAL",
            active_channels: 184
        }
    }
};

// --- Execution Node States ---
let nodeExecutionData = {
    webhook: { title: "Webhook Event", type: "Web Trigger", time: "2ms", status: "Success", input: null, output: null },
    transform: { title: "Data Transform", type: "JSON Parser", time: "8ms", status: "Success", input: null, output: null },
    crm: { title: "HubSpot CRM", type: "CRM API Integration", time: "42ms", status: "Success", input: null, output: null },
    slack: { title: "Slack Alert", type: "Chat Bot Hook", time: "28ms", status: "Success", input: null, output: null },
    email: { title: "SendGrid Email", type: "SMTP Delivery API", time: "35ms", status: "Success", input: null, output: null }
};

// --- DOM Elements ---
const presetSelect = document.getElementById('payload-preset');
const payloadEditor = document.getElementById('payload-editor');
const btnExecute = document.getElementById('btn-execute');
const canvas = document.getElementById('canvas');
const connectionsSvg = document.getElementById('connections-svg');
const consoleOutput = document.getElementById('console-output');

// Inspector UI
const inspectorTitle = document.getElementById('inspector-node-title');
const inspectorEmpty = document.getElementById('inspector-empty');
const inspectorDetails = document.getElementById('inspector-details');
const metaNodeType = document.getElementById('meta-node-type');
const metaExecTime = document.getElementById('meta-exec-time');
const metaStatus = document.getElementById('meta-status');
const dataTabs = document.querySelectorAll('.data-tab');
const jsonDataBlock = document.getElementById('json-data-block');

// --- Global State ---
let selectedNodeKey = null;
let currentTabMode = 'input'; // 'input' or 'output'
let workflowExecuting = false;

// --- Initialize App ---
function init() {
    loadPreset(presetSelect.value);
    
    presetSelect.addEventListener('change', (e) => loadPreset(e.target.value));
    btnExecute.addEventListener('click', runWorkflowExecution);
    
    // Add click listeners to nodes
    document.querySelectorAll('.w-node').forEach(nodeEl => {
        nodeEl.addEventListener('click', () => {
            const key = nodeEl.dataset.node;
            selectNode(key);
        });
    });
    
    // Data tabs in inspector
    dataTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            dataTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTabMode = tab.dataset.data;
            updateInspectorJSON();
        });
    });
    
    window.addEventListener('resize', drawConnectorWires);
    setTimeout(drawConnectorWires, 300);
}

// --- Load Preset ---
function loadPreset(key) {
    const data = PRESETS[key];
    payloadEditor.value = JSON.stringify(data, null, 2);
    addConsoleLine(`System: Loaded preset [${key}]`, 'system');
}

// --- Draw SVG Connections ---
function drawConnectorWires() {
    connectionsSvg.innerHTML = '';
    
    const lines = [
        { from: 'webhook-out', to: 'transform-in', id: 'wire-webhook-transform' },
        { from: 'transform-out', to: 'crm-in', id: 'wire-transform-crm' },
        { from: 'transform-out', to: 'slack-in', id: 'wire-transform-slack' },
        { from: 'transform-out', to: 'email-in', id: 'wire-transform-email' }
    ];
    
    const canvasRect = canvas.getBoundingClientRect();
    
    lines.forEach(line => {
        const fromEl = document.querySelector(`[data-dot="${line.from}"]`);
        const toEl = document.querySelector(`[data-dot="${line.to}"]`);
        
        if (fromEl && toEl) {
            const fromRect = fromEl.getBoundingClientRect();
            const toRect = toEl.getBoundingClientRect();
            
            const x1 = fromRect.left - canvasRect.left + (fromRect.width / 2);
            const y1 = fromRect.top - canvasRect.top + (fromRect.height / 2);
            const x2 = toRect.left - canvasRect.left + (toRect.width / 2);
            const y2 = toRect.top - canvasRect.top + (toRect.height / 2);
            
            // Nice horizontal flow S-curve bezier
            const controlOffset = Math.abs(x2 - x1) / 2;
            const pathData = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('class', 'connection-line');
            path.setAttribute('id', line.id);
            connectionsSvg.appendChild(path);
        }
    });
}

// --- Run Workflow Simulation ---
function runWorkflowExecution() {
    if (workflowExecuting) return;
    
    // Parse Payload to verify validity
    let rawPayload = null;
    try {
        rawPayload = JSON.parse(payloadEditor.value);
    } catch(err) {
        addConsoleLine(`Error: Invalid JSON syntax in editor`, 'error');
        alert("JSON Syntax Error: Please check your webhook JSON payload before executing.");
        return;
    }
    
    workflowExecuting = true;
    btnExecute.disabled = true;
    btnExecute.innerHTML = `<span class="spinner"></span> Executing...`;
    
    // Reset Node classes and statuses
    document.querySelectorAll('.w-node').forEach(nodeEl => {
        nodeEl.className = 'w-node';
        nodeEl.querySelector('.w-node-status').textContent = 'Waiting';
        nodeEl.querySelector('.w-node-status').removeAttribute('style');
    });
    document.querySelectorAll('.connection-line').forEach(line => line.classList.remove('active'));
    
    // Clear inspector selection
    hideInspector();
    
    addConsoleLine(`Pipeline: Initiated execution sequence`, 'exec');
    
    // Prepare mock data transforms
    setupMockExecutionData(rawPayload);
    
    // Step 1: Execute Webhook node
    setTimeout(() => {
        const webhookNode = document.getElementById('wnode-webhook');
        webhookNode.classList.add('active-exec');
        webhookNode.querySelector('.w-node-status').textContent = 'Executing...';
        
        setTimeout(() => {
            webhookNode.classList.remove('active-exec');
            webhookNode.classList.add('success');
            webhookNode.querySelector('.w-node-status').textContent = 'Success';
            addConsoleLine(`Node [Webhook]: Received HTTP POST event successfully (2ms)`, 'success');
            
            // Flow line: Webhook -> Transform
            document.getElementById('wire-webhook-transform').classList.add('active');
            
            // Step 2: Data Transform
            setTimeout(() => {
                const transformNode = document.getElementById('wnode-transform');
                transformNode.classList.add('active-exec');
                transformNode.querySelector('.w-node-status').textContent = 'Executing...';
                
                setTimeout(() => {
                    transformNode.classList.remove('active-exec');
                    transformNode.classList.add('success');
                    transformNode.querySelector('.w-node-status').textContent = 'Success';
                    addConsoleLine(`Node [Transform]: Parsed schemas, mapped variables (8ms)`, 'success');
                    
                    // Flow lines: Transform -> CRM, Slack, Email
                    document.getElementById('wire-transform-crm').classList.add('active');
                    document.getElementById('wire-transform-slack').classList.add('active');
                    document.getElementById('wire-transform-email').classList.add('active');
                    
                    // Step 3: Parallel integrations
                    setTimeout(() => {
                        executeParallelNodes();
                    }, 800);
                    
                }, 1000);
            }, 800);
            
        }, 800);
    }, 400);
}

// --- Execute parallel outputs ---
function executeParallelNodes() {
    const crmNode = document.getElementById('wnode-crm');
    const slackNode = document.getElementById('wnode-slack');
    const emailNode = document.getElementById('wnode-email');
    
    crmNode.classList.add('active-exec');
    crmNode.querySelector('.w-node-status').textContent = 'Syncing CRM...';
    
    slackNode.classList.add('active-exec');
    slackNode.querySelector('.w-node-status').textContent = 'Posting Alert...';
    
    emailNode.classList.add('active-exec');
    emailNode.querySelector('.w-node-status').textContent = 'Sending email...';
    
    // Simulate CRM finish
    setTimeout(() => {
        crmNode.classList.remove('active-exec');
        crmNode.classList.add('success');
        crmNode.querySelector('.w-node-status').textContent = 'Success';
        addConsoleLine(`Node [HubSpot CRM]: Synced profile. contact_id=293021 (42ms)`, 'success');
    }, 1200);
    
    // Simulate Slack finish
    setTimeout(() => {
        slackNode.classList.remove('active-exec');
        slackNode.classList.add('success');
        slackNode.querySelector('.w-node-status').textContent = 'Success';
        addConsoleLine(`Node [Slack Alert]: Posted layout to #outreach-pipeline (28ms)`, 'success');
    }, 700);
    
    // Simulate Email finish
    setTimeout(() => {
        emailNode.classList.remove('active-exec');
        emailNode.classList.add('success');
        emailNode.querySelector('.w-node-status').textContent = 'Success';
        addConsoleLine(`Node [SendGrid Email]: Dispatched template id: d-welcome-1 (35ms)`, 'success');
    }, 900);
    
    // Wrap up execution
    setTimeout(() => {
        workflowExecuting = false;
        btnExecute.disabled = false;
        btnExecute.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/></svg> Execute Pipeline`;
        addConsoleLine(`Pipeline: Execution completed successfully. All nodes status: 200 OK.`, 'exec');
        
        // Select webhook node automatically to guide user to click nodes
        selectNode('webhook');
    }, 1500);
}

// --- Setup Payload Transformation Mapping ---
function setupMockExecutionData(payload) {
    const isSignup = payload.event === 'form.submit';
    const isStripe = payload.event === 'charge.succeeded';
    
    // Webhook Data
    nodeExecutionData.webhook.input = payload;
    nodeExecutionData.webhook.output = {
        received_at: new Date().toISOString(),
        raw_body: payload,
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "A1-Webhook-Agent-v1.0",
            "X-Signature": "sha256=9db01b7a2d3e4f..."
        }
    };
    
    // Transform Data
    nodeExecutionData.transform.input = nodeExecutionData.webhook.output;
    let transformed = {
        pipeline_run_id: "run_" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        schema_version: "2.1",
        payload_type: payload.event,
        validated: true,
        extracted: {}
    };
    
    if (isSignup) {
        transformed.extracted = {
            contact_name: payload.data.name || "Unknown",
            contact_email: payload.data.email || "unknown@domain.com",
            org_name: payload.data.company || "N/A",
            phone_number: payload.data.phone || "N/A",
            lead_intent: "high",
            lead_score: 85,
            routing_key: "sales_inbound"
        };
    } else if (isStripe) {
        transformed.extracted = {
            stripe_cus_id: payload.data.customer_id,
            contact_email: payload.data.email,
            charge_amount_cents: payload.data.amount,
            charge_amount_formatted: "$" + (payload.data.amount / 100).toFixed(2),
            item_description: payload.data.description,
            currency: payload.data.currency.toUpperCase(),
            routing_key: "billing_ops"
        };
    } else { // System alert
        transformed.extracted = {
            system_node: payload.data.server_id,
            metric_violator: "cpu_load",
            value: payload.data.cpu_load + "%",
            severity: payload.data.severity,
            routing_key: "devops_critical"
        };
    }
    nodeExecutionData.transform.output = transformed;
    
    // HubSpot CRM Data
    nodeExecutionData.crm.input = transformed;
    nodeExecutionData.crm.output = {
        hubspot_api_status: "CREATED_OR_UPDATED",
        contact_id: Math.floor(Math.random() * 900000) + 100000,
        sync_timestamp: new Date().toISOString(),
        properties_synced: transformed.extracted
    };
    
    // Slack Data
    nodeExecutionData.slack.input = transformed;
    nodeExecutionData.slack.output = {
        slack_api_status: "MESSAGE_POSTED",
        channel: "#inbound-pipeline",
        message_timestamp: (Date.now() / 1000).toFixed(6),
        blocks_formatted: {
            type: "home",
            blocks: [
                { type: "header", text: { type: "plain_text", text: `🚨 Trigger Event: ${transformed.payload_type}` } },
                { type: "section", fields: Object.entries(transformed.extracted).map(([k, v]) => ({ type: "mrkdwn", text: `*${k}:* ${v}` })) }
            ]
        }
    };
    
    // SendGrid Data
    nodeExecutionData.email.input = transformed;
    nodeExecutionData.email.output = {
        sendgrid_api_status: "DISPATCHED",
        message_id: "msg_" + Math.random().toString(36).substr(2, 9),
        recipient: transformed.extracted.contact_email || "ops@a1techsolution.com",
        template_id: isSignup ? "d-welcome-lead" : (isStripe ? "d-receipt-invoice" : "d-ops-incident-alert"),
        success: true
    };
}

// --- Select Node for Inspector ---
function selectNode(key) {
    selectedNodeKey = key;
    
    document.querySelectorAll('.w-node').forEach(nodeEl => {
        nodeEl.classList.remove('selected');
    });
    
    const nodeEl = document.getElementById(`wnode-${key}`);
    if (nodeEl) {
        nodeEl.classList.add('selected');
    }
    
    // Populate Inspector UI
    const data = nodeExecutionData[key];
    if (!data.input) {
        hideInspector();
        return;
    }
    
    inspectorEmpty.classList.add('hidden');
    inspectorDetails.classList.remove('hidden');
    
    inspectorTitle.textContent = data.title;
    metaNodeType.textContent = data.type;
    metaExecTime.textContent = data.time;
    metaStatus.textContent = data.status;
    
    updateInspectorJSON();
}

// --- Update JSON Block ---
function updateInspectorJSON() {
    if (!selectedNodeKey) return;
    
    const nodeData = nodeExecutionData[selectedNodeKey];
    const targetData = currentTabMode === 'input' ? nodeData.input : nodeData.output;
    
    jsonDataBlock.textContent = JSON.stringify(targetData, null, 2);
}

// --- Hide Inspector ---
function hideInspector() {
    inspectorEmpty.classList.remove('hidden');
    inspectorDetails.classList.add('hidden');
    inspectorTitle.textContent = "Node Inspector";
    selectedNodeKey = null;
}

// --- Console Output Helpers ---
function addConsoleLine(text, type = 'system') {
    const now = new Date();
    const timeStr = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
    
    const entry = document.createElement('div');
    entry.classList.add('console-line', type);
    entry.innerHTML = `<span class="console-label">${timeStr} [${type.toUpperCase()}]</span> ${text}`;
    
    consoleOutput.appendChild(entry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Run app
window.addEventListener('DOMContentLoaded', init);
