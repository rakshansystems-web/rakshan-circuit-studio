// --- 1. CANVAS SETUP ---
const canvas = document.getElementById('circuitCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawCanvas();
    }
}
window.addEventListener('resize', resizeCanvas);

let circuitComponents = [];

function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid points
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let x = 15; x < canvas.width; x += 25) {
        for (let y = 15; y < canvas.height; y += 25) {
            ctx.fillRect(x, y, 2, 2);
        }
    }

    // Draw dropped components
    circuitComponents.forEach((comp, index) => {
        let color = '#007acc';
        if (comp.type.includes('Arduino') || comp.type.includes('ESP32') || comp.type.includes('Pico')) color = '#00979d';
        else if (comp.type.includes('Vacuum') || comp.type.includes('Relay')) color = '#a25926';
        else if (comp.type.includes('Sensor') || comp.type.includes('LCD')) color = '#6f42c1';

        ctx.fillStyle = color;
        ctx.fillRect(comp.x, comp.y, 130, 45);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(comp.x, comp.y, 130, 45);

        ctx.fillStyle = 'white';
        ctx.font = '11px sans-serif';
        ctx.fillText(comp.type, comp.x + 8, comp.y + 27);
    });
}

function addPart(type) {
    circuitComponents.push({ type: type, x: 60 + (circuitComponents.length * 15) % 300, y: 60 + Math.floor(circuitComponents.length / 15) * 60 });
    drawCanvas();
}

// Collapsible category sections like Tinkercad
function toggleSection(secId) {
    const sec = document.getElementById(secId);
    if (sec.style.display === 'none') {
        sec.style.display = 'flex';
    } else {
        sec.style.display = 'none';
    }
}

// --- 2. VIEW SWITCHING ---
function switchView(viewName) {
    document.getElementById('circuit-panel').classList.remove('active-panel');
    document.getElementById('blocks-panel').classList.remove('active-panel');
    
    if (viewName === 'circuit') {
        document.getElementById('circuit-panel').classList.add('active-panel');
        resizeCanvas();
    } else {
        document.getElementById('blocks-panel').classList.add('active-panel');
        Blockly.svgResize(workspace);
    }
}

// --- 3. BLOCKLY & CODE GENERATOR SETUP ---
Blockly.Blocks['arduino_pin_mode'] = {
  init: function() {
    this.appendDummyInput().appendField("Set Pin").appendField(new Blockly.FieldTextInput("13"), "PIN").appendField("as").appendField(new Blockly.FieldDropdown([["OUTPUT", "OUTPUT"], ["INPUT", "INPUT"]]), "MODE");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
  }
};

Blockly.Blocks['digital_write'] = {
  init: function() {
    this.appendDummyInput().appendField("Digital Write Pin").appendField(new Blockly.FieldTextInput("13"), "PIN").appendField("State").appendField(new Blockly.FieldDropdown([["HIGH", "HIGH"], ["LOW", "LOW"]]), "STATE");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
  }
};

Blockly.Blocks['delay_ms'] = {
  init: function() {
    this.appendValueInput("DELAY").setCheck("Number").appendField("Delay (ms)");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
  }
};

const workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox'),
    grid: { spacing: 20, length: 3, colour: '#444', snap: true },
    zoom: { controls: true, wheel: true }
});

let currentLang = 'arduino';

function changeLanguage(lang) {
    currentLang = lang;
    updateLiveCode();
}

function updateLiveCode() {
    let code = "";
    
    if (currentLang === 'arduino') {
        code += "// Generated Arduino C++ Code\nvoid setup() {\n";
        workspace.getAllBlocks().forEach(b => {
            if (b.type === 'arduino_pin_mode') {
                code += `  pinMode(${b.getFieldValue('PIN')}, ${b.getFieldValue('MODE')});\n`;
            }
        });
        code += "}\n\nvoid loop() {\n";
        workspace.getAllBlocks().forEach(b => {
            if (b.type === 'digital_write') {
                code += `  digitalWrite(${b.getFieldValue('PIN')}, ${b.getFieldValue('STATE')});\n`;
            }
        });
        code += "}\n";
    } else if (currentLang === 'python') {
        code += "# Generated MicroPython Code\nfrom machine import Pin\nimport time\n\n";
        workspace.getAllBlocks().forEach(b => {
            if (b.type === 'digital_write') {
                let stateVal = b.getFieldValue('STATE') === 'HIGH' ? '1' : '0';
                code += `pin_${b.getFieldValue('PIN')} = Pin(${b.getFieldValue('PIN')}, Pin.OUT)\npin_${b.getFieldValue('PIN')}.value(${stateVal})\n`;
            }
        });
    } else {
        code = JSON.stringify({ components: circuitComponents, blocks: Blockly.serialization.workspaces.save(workspace) }, null, 2);
    }

    document.getElementById('codeOutput').textContent = code;
    hljs.highlightAll();
}

workspace.addChangeListener(updateLiveCode);

// --- 4. BACKEND PROJECT SAVING ---
function saveFullProject() {
    let projectData = {
        components: circuitComponents,
        code: document.getElementById('codeOutput').textContent
    };

    fetch('/save-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
    })
    .then(res => res.json())
    .then(data => alert(data.message));
}

// Initial canvas setup call
setTimeout(resizeCanvas, 100);
