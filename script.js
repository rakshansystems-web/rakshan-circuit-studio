// --- 1. CANVAS SETUP ---
const canvas = document.getElementById('circuitCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth - 240;
canvas.height = window.innerHeight - 50;

let circuitComponents = [];

function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw components on canvas
    circuitComponents.forEach((comp, index) => {
        ctx.fillStyle = comp.type.includes('Arduino') ? '#00979d' : comp.type.includes('Vacuum') ? '#8b4513' : '#007acc';
        ctx.fillRect(comp.x, comp.y, 110, 45);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(comp.type, comp.x + 8, comp.y + 27);
    });
}

function addPart(type) {
    circuitComponents.push({ type: type, x: 80 + (circuitComponents.length * 30), y: 80 });
    drawCanvas();
}
drawCanvas();

// --- 2. VIEW SWITCHING ---
function switchView(viewName) {
    document.getElementById('circuit-panel').classList.remove('active-panel');
    document.getElementById('blocks-panel').classList.remove('active-panel');
    
    if (viewName === 'circuit') {
        document.getElementById('circuit-panel').classList.add('active-panel');
        canvas.width = window.innerWidth - 240;
        canvas.height = window.innerHeight - 50;
        drawCanvas();
    } else {
        document.getElementById('blocks-panel').classList.add('active-panel');
        Blockly.svgResize(workspace);
    }
}

// --- 3. BLOCKLY & CODE GENERATOR SETUP ---
// Define custom block structures
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

// Simple code generator engine based on blocks
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
                code += `  digitalWrite(${b.getFieldValue('PIN')}, ${b.getFieldValue('STATE'}});\n`;
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
        // JSON Netlist representation
        code = JSON.stringify({ components: circuitComponents, blocks_saved: Blockly.serialization.workspaces.save(workspace) }, null, 2);
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