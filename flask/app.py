from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# URL da API em JavaScript
API_URL = "http://localhost:8000"

# Criar uma nova coleta
@app.route('/criar_coleta', methods=['POST'])
def criar_coleta():
    dados = request.get_json()
    try:
        resposta = requests.post(f"{API_URL}/coletas", json=dados)
        return jsonify(resposta.json()), resposta.status_code
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Consultar todas as coletas
@app.route('/consultar_coletas', methods=['GET'])
def consultar_coletas():
    try:
        resposta = requests.get(f"{API_URL}/coletas")
        return jsonify(resposta.json()), resposta.status_code
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Consultar coleta por ID
@app.route('/coleta/<int:coleta_id>', methods=['GET'])
def consultar_coleta_por_id(coleta_id):
    try:
        resposta = requests.get(f"{API_URL}/coletas/{coleta_id}")
        return jsonify(resposta.json()), resposta.status_code
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Editar coleta por ID
@app.route('/editar_coleta/<int:coleta_id>', methods=['PUT'])
def editar_coleta(coleta_id):
    dados = request.get_json()
    try:
        resposta = requests.put(f"{API_URL}/coletas/{coleta_id}", json=dados)
        return jsonify(resposta.json()), resposta.status_code
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# Deletar coleta por ID
@app.route('/deletar_coleta/<int:coleta_id>', methods=['DELETE'])
def deletar_coleta(coleta_id):
    try:
        resposta = requests.delete(f"{API_URL}/coletas/{coleta_id}")
        return jsonify(resposta.json()), resposta.status_code
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


if __name__ == '__main__':
    app.run(port=8000, debug=True)
