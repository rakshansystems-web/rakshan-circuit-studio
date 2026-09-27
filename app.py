from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

# Endpoint to receive circuit design and generated code from the frontend
@app.route('/save-project', methods=['POST'])
def save_project():
    data = request.json
    circuit_components = data.get('components')
    generated_code = data.get('code')
    
    # You can process, simulate, or save this data to a database here
    print(f"Received {len(circuit_components)} components and compiled code.")
    
    return jsonify({
        "status": "success", 
        "message": "Project saved and compiled successfully on the Python backend!"
    })

if __name__ == '__main__':
    app.run(debug=True)