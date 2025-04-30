from flask import Flask, jsonify, request

app = Flask(__name__)

coletas = []
next_id = 1 


# Consultar todas as coletas
@app.route('/coletas', methods=['GET'])
def get_coletas():
    if coletas:
        return jsonify(coletas), 200
    return jsonify({"message": "Coletas não encontradas"}), 404

# Excluir coleta por id <--- (/coletas/id) <--- DELETE
@app.route('/coletas/<int:coleta_id>', methods=['DELETE'])
def delete_coleta_by_id(coleta_id):
    for coleta in coletas: 
        if coleta.get('id') == coleta_id:
            coletas.remove(coleta)
            return jsonify(coleta), 200
    return jsonify({"message": "Coleta não deletada"}), 404


# Consultar coleta por ID
@app.route('/coletas/<int:coleta_id>', methods=['GET'])
def get_coleta_by_id(coleta_id):
    for coleta in coletas:
        if coleta.get('id') == coleta_id:
            return jsonify(coleta), 200
    return jsonify({"message": "Coleta não encontrada"}), 404

# Editar coleta
@app.route('/coletas/<int:coleta_id>', methods=['PUT'])
def update_coleta(coleta_id):
    update_coleta = request.get_json()
    for coleta in coletas:
        if coleta.get('id') == coleta_id:
            coleta.update(update_coleta)
            return jsonify(coleta), 200
    return jsonify({"message": "Coleta não encontrada"}), 404

# Criar coleta
@app.route('/coletas', methods=['POST'])
def create_coleta():
    global next_id
    new_coleta = request.get_json()
    new_coleta['id'] = next_id 
    coletas.append(new_coleta)
    next_id += 1
    return jsonify(new_coleta), 201



# Rodar o servidor
app.run(port=8000, host='localhost', debug=True)
